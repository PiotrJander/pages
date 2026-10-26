// The room: one kiosk's socket, and every reading sent to it.
//
// A reading streams when the kiosk is idle (or the plan says "now"): the
// page gets `start` with the whole poem laid out, then `chunk`s of PCM audio
// with the words they time, then `end`. When the kiosk is already reading,
// the next one is synthesized whole, kept here for a few minutes and sent
// as `poem` with its timings, for the page to fetch and queue.
//
//   room -> page   start {id, mode, poem} · chunk {id, audio, words} · end {id, duration, words}
//                  poem {id, mode, poem, words, audio} · failed {id, error} · control {action}
//   page -> room   hello {key} · state {busy, armed, title, queued}
//
// `words` are [index, start, end] in seconds, index counting words in
// reading order across the whole poem.

import { DurableObject } from "cloudflare:workers";
import { extractFromUrl } from "./extract.js";
import { guessLanguage } from "./poem.js";
import { resolve, layout, StreamTimer } from "./plan.js";
import { stream, synthesize, VOICES } from "./speech.js";

const KEEP_AUDIO = 4;
const SETTLE_MS = 4000;              // after a send, the kiosk counts as busy until it reports back
const ACTIONS = ["pause", "resume", "restart", "skip", "stop"];

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.audio = new Map();          // id -> mp3 bytes for queued readings
    this.streaming = 0;
    this.lastSend = 0;
    // keep-alive pings are answered by the runtime, so an idle kiosk lets the room hibernate
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  // ---------- the kiosk socket ----------

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ authed: false });
      return new Response(null, { status: 101, webSocket: client });
    }
    const m = url.pathname.match(/^\/audio\/([\w-]+)$/);
    if (m) {
      const bytes = this.audio.get(m[1]);
      return bytes
        ? new Response(bytes, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } })
        : new Response("Gone", { status: 404 });
    }
    return new Response("Not found", { status: 404 });
  }

  webSocketMessage(ws, data) {
    if (typeof data !== "string") return;
    let msg; try { msg = JSON.parse(data); } catch { return; }
    const att = ws.deserializeAttachment() || {};
    if (msg.type === "hello") {
      if (!this.env.VIEWER_KEY || msg.key !== this.env.VIEWER_KEY) { ws.close(4401, "bad key"); return; }
      // one kiosk: a newer page replaces an older one
      for (const other of this.ctx.getWebSockets()) if (other !== ws) { try { other.close(4000, "replaced"); } catch {} }
      ws.serializeAttachment({ authed: true, busy: false, armed: false });
      this.send({ type: "welcome" }, ws);
      return;
    }
    if (!att.authed) return;
    if (msg.type === "state") {
      ws.serializeAttachment({ ...att, busy: !!msg.busy, armed: !!msg.armed,
        title: typeof msg.title === "string" ? msg.title.slice(0, 200) : null,
        queued: Number(msg.queued) || 0, paused: !!msg.paused });
    }
  }

  webSocketClose(ws, code) { try { ws.close(code, "closing"); } catch {} }

  kiosk() {
    return this.ctx.getWebSockets().find(ws => ws.deserializeAttachment()?.authed) || null;
  }

  send(msg, ws = this.kiosk()) {
    if (!ws) return false;
    try { ws.send(JSON.stringify(msg)); return true; } catch { return false; }
  }

  busy() {
    const k = this.kiosk();
    return this.streaming > 0 || Date.now() - this.lastSend < SETTLE_MS || !!k?.deserializeAttachment()?.busy;
  }

  // ---------- commands, called by the Worker over RPC ----------

  async read(plan = {}) {
    const mode = plan.mode === "now" ? "now" : "queue";
    let pageLines = null, page = null;
    if (!(typeof plan.text === "string" && plan.text.trim())) {
      if (typeof plan.url !== "string" || !plan.url.trim()) throw new Error("Give either url or text.");
      page = await extractFromUrl(plan.url.trim());
      pageLines = page.text.split("\n");
    }
    const { source, notes } = resolve(plan, pageLines);
    const lang = String(plan.language || guessLanguage(source)).slice(0, 2).toLowerCase();
    const title = plan.title || null;
    const author = plan.author || (page?.byline || "").replace(/^\s*by\s+/i, "").trim() || null;
    const lay = layout(source, { title, author, lang });
    if (!lay.words.length) throw new Error("The plan selects no words to read.");
    const voice = plan.voice || VOICES[lang] || VOICES.en;
    if (!plan.voice && !VOICES[lang]) notes.push(`no default voice for "${lang}": the English one reads it; pass voice to choose`);

    const lines = lay.parsed.lines;
    const summary = {
      title: lay.poem.title, author: lay.poem.author, language: lang, voice,
      lines: lines.length, words: lay.words.length, characters: lay.comp.spoken.length,
      first_line: lines[0]?.text ?? null, last_line: lines[lines.length - 1]?.text ?? null,
      directions: lay.comp.directions.map(d => d.text), notes
    };
    if (plan.dry_run) return { dry_run: true, ...summary };
    if (!this.kiosk()) return { sent: false, ...summary, notes: [...notes, "no display is connected: open the page and tap it once, then send again"] };

    const id = crypto.randomUUID();
    const key = this.env.ELEVENLABS_API_KEY, base = this.env.ELEVENLABS_BASE || undefined;
    const timer = new StreamTimer(lay);

    if (mode === "now" || !this.busy()) {
      this.streaming++;
      const t0 = Date.now();
      let firstChunk = null;
      try {
        this.send({ type: "start", id, mode, poem: lay.poem });
        const duration = await stream(key, { text: lay.comp.spoken, voice, base }, ({ audio, alignment }) => {
          firstChunk ??= Date.now() - t0;
          timer.add(alignment);
          const words = timer.ready();
          if (audio || words.length) this.send({ type: "chunk", id, audio, words });
        });
        this.send({ type: "end", id, duration: Math.round(duration * 1000) / 1000, words: timer.finish(duration) });
        return { sent: true, how: "streamed", mode, seconds: Math.round(duration), first_audio_ms: firstChunk, ...summary };
      } catch (e) {
        this.send({ type: "failed", id, error: String(e.message || e).slice(0, 200) });
        throw e;
      } finally {
        this.streaming--;
        this.lastSend = Date.now();
      }
    }

    const { bytes, alignment } = await synthesize(key, { text: lay.comp.spoken, voice, base });
    timer.add(alignment);
    const words = timer.finish(null);
    this.audio.set(id, bytes);
    for (const old of [...this.audio.keys()].slice(0, -KEEP_AUDIO)) this.audio.delete(old);
    const seconds = words.length ? words[words.length - 1][2] : null;
    this.send({ type: "poem", id, mode, poem: lay.poem, words, audio: `/audio/${id}` });
    this.lastSend = Date.now();
    return { sent: true, how: "queued", mode, seconds: seconds && Math.round(seconds), ...summary };
  }

  control(action) {
    if (!ACTIONS.includes(action)) return { ok: false, message: `Unknown action "${action}". Use ${ACTIONS.join(", ")}.` };
    return this.send({ type: "control", action })
      ? { ok: true, message: `Sent ${action} to the display.` }
      : { ok: false, message: "No display is connected." };
  }

  status() {
    const k = this.kiosk();
    if (!k) return { connected: false };
    const a = k.deserializeAttachment() || {};
    return { connected: true, armed: !!a.armed, busy: !!a.busy, paused: !!a.paused,
             title: a.title || null, queued: a.queued || 0, streaming: this.streaming > 0 };
  }
}

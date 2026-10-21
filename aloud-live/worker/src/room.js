// One room that every display joins and every command reaches, so the
// agent's request and the kiosk's socket always meet.
//
// The displays own playback: each keeps its own queue in memory and
// decides what to play next. The room only pushes and asks.
//
//   room -> display   poem {mode: "now" | "queue", poem, audio}
//                     control {action: pause | resume | restart | skip | stop}
//                     query {qid}
//   display -> room   hello {key}            (authentication, first message)
//                     state {qid, ...}       (only ever in answer to a query)
//
// Displays never speak unprompted and keep-alive pings are answered by the
// runtime, so the room hibernates between commands however many screens
// are connected. Audio is held in memory only for the moment it takes the
// displays to fetch it.

import { DurableObject } from "cloudflare:workers";
import { compose, buildBundle, fitBudget, guessLanguage, normalise, undoubleSpace } from "./poem.js";
import { extractFromUrl } from "./extract.js";
import { cleanup, direct, OPENROUTER, DIRECTOR_MODELS } from "./llm.js";
import { synthesize, synthesizeViaOpenRouter, VOICES, LEAD, STANZA, BUDGET } from "./speech.js";

const HELLO_GRACE_MS = 10_000;
const QUERY_TIMEOUT_MS = 3_000;
const KEEP_AUDIO = 3;
const OPTS = { lead: LEAD, stanza: STANZA };

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.audio = new Map();       // id -> bytes, the last few readings only
    this.queries = new Map();     // qid -> pending status query
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  // ---------- HTTP: socket upgrade and audio ----------

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected a WebSocket upgrade.", { status: 426 });
      }
      const [client, server] = Object.values(new WebSocketPair());
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ sid: crypto.randomUUID().slice(0, 8), authed: false, since: Date.now() });
      return new Response(null, { status: 101, webSocket: client });
    }
    const m = url.pathname.match(/^\/audio\/([\w-]+)$/);
    if (m) {
      const bytes = this.audio.get(m[1]);
      if (!bytes) return new Response("That reading is no longer held here.", { status: 404 });
      return new Response(bytes, {
        headers: { "Content-Type": "audio/mpeg", "Content-Length": String(bytes.byteLength),
                   "Cache-Control": "private, max-age=600" }
      });
    }
    return new Response("Not found", { status: 404 });
  }

  // ---------- sockets ----------

  async webSocketMessage(ws, data) {
    if (typeof data !== "string") return;
    let msg;
    try { msg = JSON.parse(data); } catch { return; }
    const att = ws.deserializeAttachment() ?? {};

    if (!att.authed) {
      if (msg.type === "hello" && msg.key && msg.key === this.env.VIEWER_KEY) {
        att.authed = true;
        ws.serializeAttachment(att);
        this.send(ws, { type: "welcome" });
      } else {
        ws.close(4401, "Unauthorized");
      }
      return;
    }
    if (msg.type === "state" && this.queries.has(msg.qid)) {
      const q = this.queries.get(msg.qid);
      const { type, qid, ...state } = msg;
      q.replies.set(att.sid, state);
      if (q.replies.size >= q.expected) q.finish();
    }
  }

  async webSocketClose(ws, code) { try { ws.close(code); } catch {} }
  async webSocketError() {}

  /** Authenticated displays; sockets that never said hello are closed. */
  displays() {
    return this.ctx.getWebSockets().filter(ws => {
      const a = ws.deserializeAttachment();
      if (!a?.authed && Date.now() - (a?.since ?? 0) > HELLO_GRACE_MS) {
        try { ws.close(4401, "No hello"); } catch {}
        return false;
      }
      return !!a?.authed;
    });
  }

  send(ws, msg) { try { ws.send(JSON.stringify(msg)); } catch {} }

  broadcast(msg) {
    const ds = this.displays();
    for (const ws of ds) this.send(ws, msg);
    return ds.length;
  }

  // ---------- commands, called by the Worker over RPC ----------

  async speak(args = {}) {
    const env = this.env;
    const llmBase = env.OPENROUTER_BASE || OPENROUTER;
    const hasText = typeof args.text === "string" && args.text.trim();
    const hasUrl = typeof args.url === "string" && args.url.trim();
    if (!!hasText === !!hasUrl) throw new Error("Give either `text` or `url` — exactly one of them.");
    const mode = args.mode === "now" ? "now" : "queue";
    const instructions = typeof args.instructions === "string" && args.instructions.trim() ? args.instructions.trim() : null;
    const model = args.model === "opus" ? "opus" : "sonnet";
    const explicitLang = args.language?.toLowerCase().slice(0, 2) || null;

    const notes = [];
    let source, title = null, author = null, lang = explicitLang;

    if (hasUrl) {
      const page = await extractFromUrl(args.url.trim());
      const clean = await cleanup(env.OPENROUTER_API_KEY, {
        page, passage: args.passage, budget: BUDGET - 400, base: llmBase
      });
      source = undoubleSpace(clean.text);
      title = clean.title;
      author = clean.author;
      lang ||= clean.language;
      notes.push(`Extracted with ${page.via} and cleaned by the cleanup model.`);
    } else {
      source = normalise(args.text).trim();
    }
    lang = (lang || guessLanguage(source)).toLowerCase();

    // cut to length first, so the director sees exactly what will be read
    const fitted = fitBudget(source, BUDGET - 300, OPTS);
    if (fitted.truncated) notes.push("The text was longer than one reading, so it was cut at a stanza or paragraph boundary.");
    source = fitted.text;

    // instructions imply a director, even with direct: false
    let marked = source, directed = false;
    if (args.direct !== false || instructions) {
      try {
        const out = await direct(env.OPENROUTER_API_KEY, {
          text: source, instructions, model: DIRECTOR_MODELS[model], base: llmBase
        });
        marked = out.text;
        directed = true;
        if (out.title) title = out.title;
        if (out.language && !explicitLang) lang = out.language;
      } catch (e) {
        notes.push(`Direction failed (${e.message}), so the reading is undirected.`);
      }
    }
    const fitted2 = fitBudget(marked, BUDGET, OPTS);
    if (fitted2.truncated && !fitted.truncated) notes.push("The directed text was longer than one reading, so it was cut at a stanza or paragraph boundary.");
    marked = fitted2.text;

    if (args.dry_run) {
      return { dryRun: true, title, author, language: lang, directed, model, instructions, text: marked, notes };
    }

    const voice = args.voice || (lang === "pl" ? VOICES.pl : VOICES.en);
    if (!args.voice && lang !== "en" && lang !== "pl") {
      notes.push(`No voice was chosen for "${lang}", so the default English voice reads it; find_voices can suggest a native one.`);
    }
    const spoken = compose(marked, OPTS).spoken;
    let speech, via = "elevenlabs";
    try {
      speech = await synthesize(env.ELEVENLABS_API_KEY, { text: spoken, voice, base: env.ELEVENLABS_BASE || undefined });
    } catch (e) {
      try {
        speech = await synthesizeViaOpenRouter(env.OPENROUTER_API_KEY, { text: spoken, voice, base: env.OPENROUTER_BASE || undefined });
        via = "openrouter";
        notes.push(`ElevenLabs refused (${e.message}), so the voice came through OpenRouter instead. ` +
                   "That route returns no timings, so the highlighting is estimated from the audio's length.");
      } catch (e2) {
        throw new Error(`ElevenLabs failed (${e.message}), and so did the fallback through OpenRouter (${e2.message}).`);
      }
    }

    const id = crypto.randomUUID();
    const { bundle, lines } = buildBundle({
      id, source: marked, alignment: speech.alignment, duration: speech.duration, ...OPTS, title, author, lang
    });
    const { bytes } = speech;
    if (!bundle.exact && via === "elevenlabs") notes.push("ElevenLabs returned no usable timings, so the highlighting is estimated.");

    this.audio.set(id, bytes);
    for (const old of [...this.audio.keys()].slice(0, -KEEP_AUDIO)) this.audio.delete(old);

    const sent = this.broadcast({ type: "poem", mode, poem: bundle, audio: `/audio/${id}` });
    if (!sent) notes.push("No display is connected, so nothing will be read. Open the display page and send it again.");

    return {
      sent, mode, title: bundle.title, author: bundle.author, language: lang, voice,
      lines, seconds: bundle.duration, directed, model, instructions, via,
      directions: bundle.stanzas.flatMap(s => s.lines.flatMap(l => l.dirs)),
      text: marked, notes
    };
  }

  control(action) {
    if (!["pause", "resume", "restart", "skip", "stop"].includes(action)) {
      return { ok: false, message: `Unknown action "${action}". Use pause, resume, restart, skip or stop.` };
    }
    const sent = this.broadcast({ type: "control", action });
    return sent
      ? { ok: true, message: `Sent ${action} to ${sent} display${sent === 1 ? "" : "s"}.` }
      : { ok: false, message: "No display is connected." };
  }

  /** Ask every display what it is doing, and wait briefly for the answers. */
  status() {
    const ds = this.displays();
    if (!ds.length) return Promise.resolve({ displays: 0, answered: 0, states: [] });
    const qid = crypto.randomUUID().slice(0, 8);
    return new Promise(resolve => {
      const q = {
        expected: ds.length, replies: new Map(),
        finish: () => {
          if (!this.queries.has(qid)) return;
          clearTimeout(q.timer);
          this.queries.delete(qid);
          resolve({ displays: ds.length, answered: q.replies.size, states: [...q.replies.values()] });
        }
      };
      q.timer = setTimeout(q.finish, QUERY_TIMEOUT_MS);
      this.queries.set(qid, q);
      for (const ws of ds) this.send(ws, { type: "query", qid });
    });
  }
}

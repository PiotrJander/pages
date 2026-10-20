// One reading room: every display connects here, and every command lands
// here, so the agent's request and the kiosk's socket always meet.
//
// Protocol (JSON over a hibernating WebSocket)
//   display -> room   hello {key} · armed · ready {id} · ended {id}
//   room -> display   welcome · prepare {poem,audio} · play {id,at} · pause {id,at} · stop
// A reading is prepared on every display first, silently, and only once
// they have the audio does `play` swap it onto the screen.
//
// Displays speak only when something changes, never on a timer, and
// keep-alive pings are answered by the runtime, so between readings the
// room hibernates however many screens are connected. Anything that must
// survive hibernation lives in storage or in a socket's attachment.

import { DurableObject } from "cloudflare:workers";
import { compose, buildBundle, fitBudget, guessLanguage, normalise } from "./poem.js";
import { extractFromUrl } from "./extract.js";
import { cleanup, direct, OPENROUTER } from "./llm.js";
import { synthesize, VOICES, LEAD, STANZA, BUDGET } from "./speech.js";

const READY_TIMEOUT_MS = 12_000;
const HELLO_GRACE_MS = 10_000;
const OPTS = { lead: LEAD, stanza: STANZA };

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.audio = new Map();        // id -> bytes; memory only, by design
    this.waiting = null;           // the prepare round in progress
    this.current = null;
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
    ctx.blockConcurrencyWhile(async () => {
      this.current = (await ctx.storage.get("current")) ?? null;
    });
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
        this.send(ws, { type: "welcome", displays: this.displays().length });
        this.greet(ws);
      } else {
        ws.close(4401, "Unauthorized");
      }
      return;
    }

    if (msg.type === "ready") this.onReady(ws, msg.id);
    else if (msg.type === "armed" && !att.armed) { att.armed = true; ws.serializeAttachment(att); }
    else if (msg.type === "ended" && this.current?.bundle.id === msg.id && this.current.status === "playing") {
      this.current.status = "ended";
      await this.save();
    }
  }

  async webSocketClose(ws, code) { this.forget(ws); try { ws.close(code); } catch {} }
  async webSocketError(ws) { this.forget(ws); }

  forget(ws) {
    const sid = ws.deserializeAttachment()?.sid;
    if (this.waiting) { this.waiting.pending.delete(sid); this.release(); }
  }

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
  broadcast(msg) { for (const ws of this.displays()) this.send(ws, msg); }

  /** A display that joins late is brought up to wherever the room is. */
  greet(ws) {
    const c = this.current;
    if (!c || c.status === "stopped") return;
    const held = this.audio.has(c.bundle.id);
    this.send(ws, { type: "prepare", poem: c.bundle, audio: held ? `/audio/${c.bundle.id}` : null });
  }

  onReady(ws, id) {
    const sid = ws.deserializeAttachment()?.sid;
    if (this.waiting?.id === id) { this.waiting.pending.delete(sid); this.release(); return; }
    const c = this.current;
    if (!c || c.bundle.id !== id) return;
    if (c.status === "queued") this.start(0);
    else if (c.status === "playing") this.send(ws, { type: "play", id, at: this.position() });
    else if (c.status === "paused") this.send(ws, { type: "pause", id, at: c.offset });
  }

  release() { if (this.waiting && this.waiting.pending.size === 0) this.waiting.finish(); }

  /** Send `prepare` everywhere and wait until every display has the audio. */
  prepareAll(id) {
    if (this.waiting) this.waiting.finish();            // a newer reading wins
    const sockets = this.displays();
    return new Promise(resolve => {
      const pending = new Set(sockets.map(ws => ws.deserializeAttachment().sid));
      const total = pending.size;
      const round = {
        id, pending,
        finish: () => {
          if (this.waiting !== round) return;
          clearTimeout(round.timer);
          this.waiting = null;
          resolve({ ready: total - pending.size, total });
        }
      };
      round.timer = setTimeout(round.finish, READY_TIMEOUT_MS);
      this.waiting = round;
      for (const ws of sockets) this.send(ws, { type: "prepare", poem: this.current.bundle, audio: `/audio/${id}` });
      if (!total) round.finish();
    });
  }

  position() {
    const c = this.current;
    if (!c) return 0;
    if (c.status === "playing") return Math.max(0, (Date.now() - c.startedAt) / 1000);
    if (c.status === "paused") return c.offset ?? 0;
    return 0;
  }

  start(at) {
    const c = this.current;
    c.status = "playing";
    c.startedAt = Date.now() - at * 1000;
    c.offset = 0;
    this.broadcast({ type: "play", id: c.bundle.id, at });
    return this.save();
  }

  save() {
    return this.ctx.storage.put("current", this.current);
  }

  // ---------- commands (called by the Worker over RPC) ----------

  async speak(args = {}) {
    const env = this.env;
    const llmBase = env.OPENROUTER_BASE || OPENROUTER;
    const hasText = typeof args.text === "string" && args.text.trim();
    const hasUrl = typeof args.url === "string" && args.url.trim();
    if (!!hasText === !!hasUrl) throw new Error("Give either `text` or `url` — exactly one of them.");

    const notes = [];
    let source, title = null, author = null, lang = args.language?.toLowerCase().slice(0, 2) || null;

    if (hasUrl) {
      const page = await extractFromUrl(args.url.trim());
      const clean = await cleanup(env.OPENROUTER_API_KEY, {
        page, passage: args.passage, budget: BUDGET - 400, base: llmBase
      });
      source = clean.text;
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

    let marked = source, directed = false;
    if (args.direct !== false) {
      try {
        const out = await direct(env.OPENROUTER_API_KEY, source, llmBase);
        if (out) { marked = out; directed = true; }
        else notes.push("The director changed words rather than only adding tags, so the reading is undirected.");
      } catch (e) {
        notes.push(`Direction failed (${e.message}), so the reading is undirected.`);
      }
    }
    marked = fitBudget(marked, BUDGET, OPTS).text;

    if (args.dry_run) {
      return { dryRun: true, title, author, language: lang, directed, text: marked, notes };
    }

    const voice = args.voice || (lang === "pl" ? VOICES.pl : VOICES.en);
    const spoken = compose(marked, OPTS).spoken;
    const { bytes, alignment } = await synthesize(env.ELEVENLABS_API_KEY, {
      text: spoken, voice, base: env.ELEVENLABS_BASE || undefined
    });

    const id = crypto.randomUUID();
    const { bundle, lines } = buildBundle({ id, source: marked, alignment, ...OPTS, title, author, lang });
    if (!bundle.exact) notes.push("ElevenLabs returned no usable timings, so the highlighting is estimated.");

    this.audio.set(id, bytes);
    for (const old of [...this.audio.keys()].slice(0, -2)) this.audio.delete(old);   // keep the last two
    this.current = { bundle, status: "preparing", startedAt: 0, offset: 0 };
    await this.save();

    const round = await this.prepareAll(id);
    if (this.current?.bundle.id !== id) {
      return { superseded: true, title: bundle.title, notes: ["A newer reading replaced this one before it started."] };
    }
    let played = false;
    if (round.total === 0) {
      this.current.status = "queued";
      await this.save();
      notes.push("No display is connected. The reading is queued and will start when one connects.");
    } else {
      if (round.ready < round.total) notes.push(`${round.total - round.ready} of ${round.total} displays did not load the audio in time.`);
      await this.start(0);
      played = true;
    }

    return {
      played, displays: round.total, ready: round.ready,
      title: bundle.title, author: bundle.author, language: lang, voice,
      lines, seconds: bundle.duration, directed,
      directions: bundle.stanzas.flatMap(s => s.lines.flatMap(l => l.dirs)),
      text: marked, notes
    };
  }

  async control(action) {
    const c = this.current;
    if (!c) return { ok: false, message: "Nothing has been read yet." };
    const id = c.bundle.id;
    if (action === "pause") {
      if (c.status !== "playing") return { ok: false, message: `The reading is ${c.status}, not playing.` };
      c.offset = this.position();
      c.status = "paused";
      this.broadcast({ type: "pause", id, at: c.offset });
      await this.save();
    } else if (action === "resume") {
      if (c.status !== "paused") return { ok: false, message: `The reading is ${c.status}, not paused.` };
      await this.start(c.offset);
    } else if (action === "restart") {
      if (c.status === "stopped") return { ok: false, message: "The reading was stopped; read something new instead." };
      await this.start(0);
    } else if (action === "stop") {
      c.status = "stopped";
      this.broadcast({ type: "stop" });
      await this.save();
    } else {
      return { ok: false, message: `Unknown action: ${action}` };
    }
    return { ok: true, ...this.status() };
  }

  status() {
    const ds = this.displays();
    const c = this.current;
    return {
      displays: ds.length,
      armed: ds.filter(ws => ws.deserializeAttachment()?.armed).length,
      reading: c ? {
        title: c.bundle.title, author: c.bundle.author, status: c.status,
        position: Math.round(Math.min(this.position(), c.bundle.duration || Infinity) * 10) / 10,
        seconds: c.bundle.duration
      } : null
    };
  }
}

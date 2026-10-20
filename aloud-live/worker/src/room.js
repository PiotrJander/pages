// One room that every display joins and every command reaches, so the
// agent's request and the kiosk's socket always meet.
//
// The displays own playback: each keeps its own queue in memory and
// decides what to play next. The room only pushes and asks.
//
//   room -> display   poem {mode: "now" | "queue", poem, audio}
//                     control {action: pause | resume | skip | stop}
//                     query {qid}
//   display -> room   hello {key}            (authentication, first message)
//                     state {qid, ...}       (only ever in answer to a query)
//
// Displays never speak unprompted and keep-alive pings are answered by the
// runtime, so the room hibernates between commands however many screens
// are connected. Audio is held in memory only for the moment it takes the
// displays to fetch it.

import { DurableObject } from "cloudflare:workers";
import { compose, buildBundle, fitBudget, guessLanguage, normalise } from "./poem.js";
import { extractFromUrl } from "./extract.js";
import { cleanup, direct, OPENROUTER } from "./llm.js";
import { synthesize, VOICES, LEAD, STANZA, BUDGET } from "./speech.js";

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
    const { bytes, alignment } = await synthesize(env.ELEVENLABS_API_KEY, {
      text: compose(marked, OPTS).spoken, voice, base: env.ELEVENLABS_BASE || undefined
    });

    const id = crypto.randomUUID();
    const { bundle, lines } = buildBundle({ id, source: marked, alignment, ...OPTS, title, author, lang });
    if (!bundle.exact) notes.push("ElevenLabs returned no usable timings, so the highlighting is estimated.");

    this.audio.set(id, bytes);
    for (const old of [...this.audio.keys()].slice(0, -KEEP_AUDIO)) this.audio.delete(old);

    const sent = this.broadcast({ type: "poem", mode, poem: bundle, audio: `/audio/${id}` });
    if (!sent) notes.push("No display is connected, so nothing will be read. Open the display page and send it again.");

    return {
      sent, mode, title: bundle.title, author: bundle.author, language: lang, voice,
      lines, seconds: bundle.duration, directed,
      directions: bundle.stanzas.flatMap(s => s.lines.flatMap(l => l.dirs)),
      text: marked, notes
    };
  }

  control(action) {
    if (!["pause", "resume", "skip", "stop"].includes(action)) {
      return { ok: false, message: `Unknown action "${action}". Use pause, resume, skip or stop.` };
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

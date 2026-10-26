// A minimal, stateless MCP server over Streamable HTTP: JSON-RPC on POST,
// answered with plain JSON. No server-initiated stream, so GET is refused.

import { pageAsLines } from "./page.js";
import { findVoices } from "./speech.js";

const PROTOCOLS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS = `Aloud Stream reads poems aloud on one kiosk screen, highlighting each word as it is spoken.
To read a poem: call read_page on a page that holds it, find the poem's first and last lines in the numbered output, then call read_poem with that url, those lines, and a few delivery tags placed by line number. The kiosk takes the words from the page itself, so never write a poem's words into a call. The one exception is a translation of a public-domain work, sent as text.
If the kiosk is idle the reading streams and starts within a second or so; otherwise it is queued behind what is playing. Call read_poem once per poem, in order, to queue several.
Use control to pause, resume, restart, skip or stop, status to see what the kiosk is doing, and find_voices to choose a particular voice.`;

const TAG = {
  type: "object",
  properties: {
    line: { type: "integer", description: "The line, numbered as read_page printed it (or 1-based within text)." },
    word: { type: "integer", description: "1-based word in that line the tag goes before. Defaults to 1, the start of the line." },
    tag: { type: "string", description: "An ElevenLabs v4 audio tag in square brackets, such as [softly], [slowly], [wistful], [grave], [whispers], [storyteller], [excited], [pause]." }
  },
  required: ["line", "tag"]
};

const TOOLS = [
  {
    name: "read_page",
    title: "Read a page as numbered lines",
    description: "Fetch a web page and return its main text as numbered lines (\"12| text\"), with the page's title, byline and headings. Use it to find where a poem starts and ends before calling read_poem. " +
      "Long pages are shown 400 lines at a time: pass from/to for another window, or find to list only the lines containing a word. " +
      "Works well on PoemHunter, Wikipedia, Wikisource edition pages and Project Gutenberg; Poetry Foundation and AllPoetry refuse it (403), and poets.org's poems don't come through. A bare Wikisource title is often only a list of editions.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The page holding the poem." },
        find: { type: "string", description: "Only list the lines containing this text (case and punctuation ignored)." },
        from: { type: "integer", description: "First line of the window to show." },
        to: { type: "integer", description: "Last line of the window to show." }
      },
      required: ["url"]
    },
    annotations: { title: "Read a page as numbered lines", readOnlyHint: true, openWorldHint: true }
  },
  {
    name: "read_poem",
    title: "Read a poem aloud on the kiosk",
    description: "Read one poem aloud on the kiosk. Give the url of the page read_page showed, with firstLine and lastLine: the opening words (four to six are enough) of the poem's first and last lines as they appear on the page; " +
      "from and to, the line numbers read_page printed, are recommended too, to break ties. Include only the poem: no title line, byline or notes. " +
      "Add 2 to 6 sparing tags placed by line number to direct the delivery; a pause between stanzas is added automatically. " +
      "Only for a translation of a public-domain work, give text (the translation, with line breaks and a blank line between stanzas) instead of url. " +
      "mode \"queue\" (the default) plays after whatever is playing; \"now\" cuts in. Returns once the audio is complete (a few seconds), saying whether it was streamed or queued and which lines it read.",
    inputSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The page holding the poem, as given to read_page." },
        firstLine: { type: "string", description: "Opening words of the poem's first line, as on the page." },
        lastLine: { type: "string", description: "Opening words of the poem's last line, as on the page." },
        from: { type: "integer", description: "Line number of the first line, from read_page." },
        to: { type: "integer", description: "Line number of the last line, from read_page." },
        text: { type: "string", description: "Only for a translation of a public-domain work: the words to read, instead of url." },
        title: { type: "string" },
        author: { type: "string" },
        language: { type: "string", description: "Two-letter code such as en or pl; picks the default voice." },
        voice: { type: "string", description: "An ElevenLabs voice id from find_voices, overriding the default for the language." },
        mode: { type: "string", enum: ["queue", "now"] },
        tags: { type: "array", items: TAG, description: "Delivery tags, placed by line (and optionally word)." },
        dry_run: { type: "boolean", description: "Check the plan and report what would be read, without speaking." }
      }
    },
    annotations: { title: "Read a poem aloud on the kiosk", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
  },
  {
    name: "control",
    title: "Control the kiosk",
    description: "Pause or resume the current reading, restart it from the beginning, skip to the next queued one, or stop (silence it and clear the queue).",
    inputSchema: { type: "object", properties: { action: { type: "string", enum: ["pause", "resume", "restart", "skip", "stop"] } }, required: ["action"] },
    annotations: { title: "Control the kiosk", readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "status",
    title: "What is on the kiosk",
    description: "Whether the kiosk is connected and can make sound, what it is reading, whether it is paused, and how many readings are queued.",
    inputSchema: { type: "object", properties: {} },
    annotations: { title: "What is on the kiosk", readOnlyHint: true, openWorldHint: false }
  },
  {
    name: "find_voices",
    title: "Find a voice",
    description: "Search the ElevenLabs voice library by language, gender, age, accent, use case and free text (such as \"warm storyteller\" or \"gravelly\"). Returns voice ids to pass to read_poem as voice.",
    inputSchema: {
      type: "object",
      properties: {
        language: { type: "string", description: "Two-letter code such as en, pl, fr." },
        gender: { type: "string", enum: ["male", "female", "neutral"] },
        age: { type: "string", enum: ["young", "middle_aged", "old"] },
        accent: { type: "string", description: "Such as british, american, irish, scottish, australian, or standard." },
        use_case: { type: "string", enum: ["narrative_story", "conversational", "characters_animation", "informative_educational", "entertainment_tv", "social_media", "advertisement"] },
        search: { type: "string", description: "Free text matched against names and descriptions." },
        limit: { type: "number", description: "How many to return, up to 30. Defaults to 10." }
      }
    },
    annotations: { title: "Find a voice", readOnlyHint: true, openWorldHint: true }
  }
];

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const ok = (id, result) => ({ jsonrpc: "2.0", id, result });
const fail = (id, code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });
const say = (text, extra = {}) => ({ content: [{ type: "text", text }], ...extra });

function describeRead(r) {
  const what = `${r.title ? `"${r.title}"` : "Untitled"}${r.author ? ` by ${r.author}` : ""}: ${r.lines} lines, ${r.words} words` +
    `${r.seconds ? `, about ${r.seconds} s` : ""}, language ${r.language}.`;
  const where = r.dry_run ? "Dry run: nothing was spoken."
    : r.sent === false ? "Not read: no kiosk is connected."
    : r.how === "streamed" ? `Streaming on the kiosk now${r.first_audio_ms != null ? ` (first audio after ${r.first_audio_ms} ms)` : ""}.`
    : "Queued on the kiosk, after what is playing.";
  return [where, what,
    `First line: ${r.first_line}`, `Last line: ${r.last_line}`,
    `Directions: ${r.directions?.length ? r.directions.join(" ") : "none"}.`,
    ...(r.notes || []).map(n => `Note: ${n}`)].join("\n");
}

async function callTool(params, room, env) {
  const name = params?.name, args = params?.arguments ?? {};
  try {
    if (name === "read_page") return say(await pageAsLines(args));
    if (name === "read_poem") { const r = await room.read(args); return say(describeRead(r), { structuredContent: r }); }
    if (name === "control") { const r = await room.control(args.action); return say(r.message, { isError: !r.ok }); }
    if (name === "status") {
      const s = await room.status();
      const text = !s.connected ? "No kiosk is connected."
        : `Kiosk connected, ${s.armed ? "sound on" : "sound not on yet (needs one tap)"}; ` +
          `${s.title ? `${s.paused ? "paused on" : s.busy ? "reading" : "finished"} "${s.title}"` : "idle"}` +
          `${s.queued ? `; ${s.queued} queued` : ""}${s.streaming ? "; a reading is streaming" : ""}.`;
      return say(text, { structuredContent: s });
    }
    if (name === "find_voices") {
      const { voices, more } = await findVoices(env.ELEVENLABS_API_KEY, args, env.ELEVENLABS_BASE || undefined);
      const text = voices.length
        ? [`${voices.length} voice${voices.length === 1 ? "" : "s"}${more ? " (more match; narrow the search)" : ""}:`,
           ...voices.map(v => `- ${v.name} — ${v.voice_id} — ${[v.gender, v.age?.replace("_", " "), v.accent, v.language].filter(Boolean).join(", ")}` +
             `${v.descriptive ? `, ${v.descriptive}` : ""}${v.rate ? `; costs ${v.rate}x credits` : ""}${v.description ? `. ${v.description}` : ""}`)].join("\n")
        : "No voices matched. Loosen the filters.";
      return say(text, { structuredContent: { voices, more } });
    }
    return say(`Unknown tool: ${name}`, { isError: true });
  } catch (e) {
    return say(e.message || String(e), { isError: true });
  }
}

async function handleOne(msg, room, env) {
  const isNotification = msg?.id === undefined || msg?.id === null;
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") return isNotification ? null : fail(msg?.id ?? null, -32600, "Invalid request");
  switch (msg.method) {
    case "initialize": {
      const asked = msg.params?.protocolVersion;
      return ok(msg.id, {
        protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "aloud-stream", title: "Aloud Stream", version: "1.0.0" },
        instructions: INSTRUCTIONS
      });
    }
    case "ping": return ok(msg.id, {});
    case "tools/list": return ok(msg.id, { tools: TOOLS });
    case "tools/call": return ok(msg.id, await callTool(msg.params, room, env));
    default: return isNotification ? null : fail(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function handleMcp(request, room, env) {
  if (request.method === "GET" || request.method === "DELETE") return new Response("This server answers POST only.", { status: 405, headers: { Allow: "POST" } });
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let body;
  try { body = await request.json(); } catch { return json(fail(null, -32700, "Parse error"), 400); }
  const batch = Array.isArray(body);
  const replies = [];
  for (const msg of batch ? body : [body]) { const r = await handleOne(msg, room, env); if (r) replies.push(r); }
  if (!replies.length) return new Response(null, { status: 202 });
  return json(batch ? replies : replies[0]);
}

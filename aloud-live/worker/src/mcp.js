// A minimal, stateless MCP server over Streamable HTTP: JSON-RPC on POST,
// answered with plain JSON. No server-initiated stream, so GET is refused.

const PROTOCOLS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS = `Aloud reads poems and short literary passages aloud on a display, such as a screen in a room, showing the text and highlighting each word as it is spoken.
Use read_aloud with either the text itself or the URL of a page holding it. The reading starts on every connected display once they have loaded it. Use status to see what is on screen and control to pause, resume, restart or stop.
A display must have been tapped once after loading before it can play sound; status reports how many are armed.`;

const TOOLS = [
  {
    name: "read_aloud",
    title: "Read aloud on the display",
    description:
      "Read a poem or short literary passage aloud on the connected displays. The text appears on screen and is highlighted word by word in step with the voice. " +
      "Give either `text` (the work itself) or `url` (a web page holding it, whose main content is extracted and cleaned of page debris). " +
      "A model adds sparing delivery directions unless `direct` is false. One reading holds about 3,000 characters; longer works are cut at a stanza or paragraph boundary. " +
      "Takes 10 to 30 seconds, and returns once the reading has started.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The work to read, with line breaks kept and a blank line between stanzas. Bracketed ElevenLabs tags such as [softly] are allowed: they are spoken as directions and shown only as small notes." },
        url: { type: "string", description: "A web page holding the work, such as a poem on a poetry site or a public-domain text." },
        passage: { type: "string", description: "With url: which part of the page to read, in plain words, when it holds several works or a long one." },
        direct: { type: "boolean", description: "Let a model add delivery directions. Defaults to true." },
        language: { type: "string", description: "Two-letter language code such as en or pl, which picks the voice. Detected when omitted." },
        voice: { type: "string", description: "An ElevenLabs voice id, overriding the voice picked by language." },
        dry_run: { type: "boolean", description: "Return the text that would be read, with its directions, without speaking or changing the display." }
      }
    },
    annotations: { title: "Read aloud on the display", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
  },
  {
    name: "control",
    title: "Control the reading",
    description: "Pause, resume, restart or stop the reading on every connected display.",
    inputSchema: {
      type: "object",
      properties: { action: { type: "string", enum: ["pause", "resume", "restart", "stop"] } },
      required: ["action"]
    },
    annotations: { title: "Control the reading", readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "status",
    title: "What is on the display",
    description: "How many displays are connected and armed for sound, and what is being read: title, author, status and position.",
    inputSchema: { type: "object", properties: {} },
    annotations: { title: "What is on the display", readOnlyHint: true, openWorldHint: false }
  }
];

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json" }
});
const ok = (id, result) => ({ jsonrpc: "2.0", id, result });
const fail = (id, code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });

function describe(result) {
  if (result.dryRun) {
    return [
      `Dry run — nothing was spoken.`,
      result.title ? `Title: ${result.title}` : null,
      result.author ? `Author: ${result.author}` : null,
      `Language: ${result.language}; directed: ${result.directed ? "yes" : "no"}`,
      ...result.notes.map(n => `Note: ${n}`),
      "", result.text
    ].filter(l => l !== null).join("\n");
  }
  if (result.superseded) return result.notes.join(" ");
  const head = result.played
    ? `Reading started on ${result.ready} of ${result.displays} display${result.displays === 1 ? "" : "s"}.`
    : "Prepared, but not playing yet.";
  return [
    head,
    `${result.title ? `"${result.title}"` : "Untitled"}${result.author ? ` by ${result.author}` : ""}: ${result.lines} lines, about ${Math.round(result.seconds)} seconds, language ${result.language}.`,
    result.directed
      ? `Directions: ${result.directions.length ? result.directions.join(", ") : "none needed"}.`
      : "Read without directions.",
    ...result.notes.map(n => `Note: ${n}`),
    "", "Text as read:", result.text
  ].join("\n");
}

async function callTool(params, room) {
  const name = params?.name;
  const args = params?.arguments ?? {};
  try {
    if (name === "read_aloud") {
      const result = await room.speak(args);
      return { content: [{ type: "text", text: describe(result) }] };
    }
    if (name === "control") {
      const result = await room.control(args.action);
      return { content: [{ type: "text", text: result.ok ? `Done. ${JSON.stringify(result)}` : result.message }], isError: !result.ok };
    }
    if (name === "status") {
      const s = await room.status();
      const r = s.reading;
      const text = [
        `${s.displays} display${s.displays === 1 ? "" : "s"} connected, ${s.armed} armed for sound.`,
        r ? `${r.title ? `"${r.title}"` : "Untitled"}${r.author ? ` by ${r.author}` : ""} is ${r.status}, at ${r.position}s of about ${Math.round(r.seconds)}s.`
          : "Nothing has been read yet."
      ].join("\n");
      return { content: [{ type: "text", text }], structuredContent: s };
    }
    return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
  } catch (e) {
    return { content: [{ type: "text", text: e.message || String(e) }], isError: true };
  }
}

async function handleOne(msg, room) {
  const isNotification = msg?.id === undefined || msg?.id === null;
  if (!msg || msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return isNotification ? null : fail(msg?.id ?? null, -32600, "Invalid request");
  }
  switch (msg.method) {
    case "initialize": {
      const asked = msg.params?.protocolVersion;
      return ok(msg.id, {
        protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "aloud", title: "Aloud", version: "1.0.0" },
        instructions: INSTRUCTIONS
      });
    }
    case "ping": return ok(msg.id, {});
    case "tools/list": return ok(msg.id, { tools: TOOLS });
    case "tools/call": return ok(msg.id, await callTool(msg.params, room));
    default: return isNotification ? null : fail(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function handleMcp(request, room) {
  if (request.method === "GET" || request.method === "DELETE") {
    return new Response("This server answers POST only.", { status: 405, headers: { Allow: "POST" } });
  }
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let body;
  try { body = await request.json(); } catch { return json(fail(null, -32700, "Parse error"), 400); }
  const batch = Array.isArray(body);
  const replies = [];
  for (const msg of batch ? body : [body]) {
    const reply = await handleOne(msg, room);
    if (reply) replies.push(reply);
  }
  if (!replies.length) return new Response(null, { status: 202 });
  return json(batch ? replies : replies[0]);
}

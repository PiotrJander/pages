// A minimal, stateless MCP server over Streamable HTTP: JSON-RPC on POST,
// answered with plain JSON. No server-initiated stream, so GET is refused.

const PROTOCOLS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS = `Aloud reads poems and short literary passages aloud on a display, such as a screen in a room, showing the text and highlighting each word as it is spoken.
Use read_aloud with either the text itself or the URL of a page holding it. With mode "queue" (the default) it plays after whatever is playing or queued, or at once if the display is idle; with mode "now" it cuts in as soon as its audio is ready, and the queue carries on afterwards.
Use status to ask the displays what they are doing, and control to pause, resume, skip or stop. A display must have been tapped once after loading before it can make sound; status says which are armed.`;

const TOOLS = [
  {
    name: "read_aloud",
    title: "Read aloud on the display",
    description:
      "Read a poem or short literary passage aloud on the connected displays. The text appears on screen and is highlighted word by word in step with the voice. " +
      "Give either `text` (the work itself) or `url` (a web page holding it, whose main content is extracted and cleaned of page debris). " +
      "A model adds sparing delivery directions unless `direct` is false. One reading holds about 3,000 characters; longer works are cut at a stanza or paragraph boundary. " +
      "`mode` decides what happens on the display: \"queue\" plays after the current reading and anything already queued, or at once if nothing is playing; \"now\" stops the current reading as soon as this one's audio is ready, plays this, then carries on with the queue. " +
      "Takes 10 to 30 seconds and returns once the reading has been sent.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The work to read, with line breaks kept and a blank line between stanzas. Bracketed ElevenLabs tags such as [softly] are allowed: they are spoken as directions and shown only as small notes." },
        url: { type: "string", description: "A web page holding the work, such as a poem on a poetry site or a public-domain text." },
        mode: { type: "string", enum: ["queue", "now"], description: "queue (default): after what is playing and queued, or at once if idle. now: cut in as soon as the audio is ready." },
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
    description: "Act on every connected display: pause or resume the current reading, skip to the next queued one, or stop (silence the reading and clear the queue; the poem stays on screen).",
    inputSchema: {
      type: "object",
      properties: { action: { type: "string", enum: ["pause", "resume", "skip", "stop"] } },
      required: ["action"]
    },
    annotations: { title: "Control the reading", readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "status",
    title: "What is on the display",
    description: "Ask every connected display what it is doing: whether it can make sound, what it is reading and where, and what is queued. Waits up to 3 seconds for answers.",
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
      "Dry run — nothing was spoken.",
      result.title ? `Title: ${result.title}` : null,
      result.author ? `Author: ${result.author}` : null,
      `Language: ${result.language}; directed: ${result.directed ? "yes" : "no"}`,
      ...result.notes.map(n => `Note: ${n}`),
      "", result.text
    ].filter(l => l !== null).join("\n");
  }
  const where = result.sent
    ? `Sent to ${result.sent} display${result.sent === 1 ? "" : "s"} ${result.mode === "now" ? "to play now" : "to queue"}.`
    : "Not sent: no display is connected.";
  return [
    where,
    `${result.title ? `"${result.title}"` : "Untitled"}${result.author ? ` by ${result.author}` : ""}: ${result.lines} lines, about ${Math.round(result.seconds)} seconds, language ${result.language}.`,
    result.directed
      ? `Directions: ${result.directions.length ? result.directions.join(", ") : "none needed"}.`
      : "Read without directions.",
    ...result.notes.map(n => `Note: ${n}`),
    "", "Text as read:", result.text
  ].join("\n");
}

function describeState(st, i) {
  const name = `Display ${i + 1}`;
  const sound = st.armed ? "armed" : "not armed (needs one tap)";
  const now = st.poem
    ? `${st.status} "${st.poem.title || "Untitled"}"${st.poem.author ? ` by ${st.poem.author}` : ""} at ${st.position}s of ${st.duration}s`
    : st.status;
  const queue = st.queue?.length ? `; queued: ${st.queue.map(q => `"${q.title || "Untitled"}"`).join(", ")}` : "";
  return `${name} (${sound}): ${now}${queue}.`;
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
      return { content: [{ type: "text", text: result.message }], isError: !result.ok };
    }
    if (name === "status") {
      const s = await room.status();
      const lines = s.displays
        ? [`${s.displays} display${s.displays === 1 ? "" : "s"} connected, ${s.answered} answered.`, ...s.states.map(describeState)]
        : ["No display is connected."];
      return { content: [{ type: "text", text: lines.join("\n") }], structuredContent: s };
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

import { findVoices } from "./speech.js";

// A minimal, stateless MCP server over Streamable HTTP: JSON-RPC on POST,
// answered with plain JSON. No server-initiated stream, so GET is refused.

const PROTOCOLS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];

const INSTRUCTIONS = `Aloud reads poems and short literary passages aloud on a display, such as a screen in a room, showing the text and highlighting each word as it is spoken.
Use read_aloud with either the text itself or the URL of a page holding it. With mode "queue" (the default) it plays after whatever is playing or queued, or at once if the display is idle; with mode "now" it cuts in as soon as its audio is ready, and the queue carries on afterwards.
Use status to ask the displays what they are doing, and control to pause, resume, restart, skip or stop. A display must have been tapped once after loading before it can make sound; status says which are armed.
read_aloud takes optional instructions for the rendition (a mood, a persona, a satirical delivery, or a translation) and a model for the director: use opus when the instructions ask for a translation or any rewriting of the words, sonnet otherwise. To choose a particular voice, search the ElevenLabs library with find_voices and pass the voice_id.`;

const TOOLS = [
  {
    name: "read_aloud",
    title: "Read aloud on the display",
    description:
      "Read a poem or short literary passage aloud on the connected displays. The text appears on screen and is highlighted word by word in step with the voice. " +
      "Give either `text` (the work itself) or `url` (a web page holding it, whose main content is extracted and cleaned of page debris). " +
      "A model adds sparing delivery directions unless `direct` is false; `instructions` steer that model, from a mood to a full translation, and `model` picks it (opus for translations and rewrites, sonnet otherwise). " +
      "One reading holds about 3,000 characters; longer works are cut at a stanza or paragraph boundary. " +
      "`mode` decides what happens on the display: \"queue\" plays after the current reading and anything already queued, or at once if nothing is playing; \"now\" stops the current reading as soon as this one's audio is ready, plays this, then carries on with the queue. " +
      "Takes 10 to 30 seconds and returns once the reading has been sent.",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The work to read, with line breaks kept and a blank line between stanzas. Bracketed ElevenLabs tags such as [softly] are allowed: they are spoken as directions and shown only as small notes." },
        url: { type: "string", description: "A web page holding the work, such as a poem on a poetry site or a public-domain text." },
        mode: { type: "string", enum: ["queue", "now"], description: "queue (default): after what is playing and queued, or at once if idle. now: cut in as soon as the audio is ready." },
        passage: { type: "string", description: "With url: which part of the page to read, in plain words, when it holds several works or a long one." },
        instructions: { type: "string", description: "How to render it, in plain words: a mood or pace, a persona, a satirical delivery, or a change to the words such as \"translate into Polish\". Without them the words are kept exactly and only sparing directions are added." },
        model: { type: "string", enum: ["sonnet", "opus"], description: "The director model. Set opus when the instructions ask for a translation or any rewriting of the words; sonnet (the default) for directions and moods." },
        direct: { type: "boolean", description: "Let a model add delivery directions. Defaults to true. Ignored when instructions are given." },
        language: { type: "string", description: "Two-letter language code such as en or pl, which picks the voice. Detected when omitted." },
        voice: { type: "string", description: "An ElevenLabs voice id, overriding the voice picked by language. Find one with find_voices; pick a native speaker for a translation." },
        dry_run: { type: "boolean", description: "Return the text that would be read, with its directions, without speaking or changing the display." }
      }
    },
    annotations: { title: "Read aloud on the display", readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true }
  },
  {
    name: "control",
    title: "Control the reading",
    description: "Act on every connected display: pause or resume the current reading, restart it from the beginning (replayed from the display's memory, at no cost), skip to the next queued one, or stop (silence the reading and clear the queue; the poem stays on screen).",
    inputSchema: {
      type: "object",
      properties: { action: { type: "string", enum: ["pause", "resume", "restart", "skip", "stop"] } },
      required: ["action"]
    },
    annotations: { title: "Control the reading", readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  },
  {
    name: "find_voices",
    title: "Find a voice",
    description: "Search the ElevenLabs voice library for a voice to read with, by language, gender, age, accent, use case and free text (for example \"warm storyteller\" or \"gravelly\"). Returns voice ids to pass to read_aloud as `voice`, with a short description of each.",
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
      `Language: ${result.language}; directed: ${result.directed ? `yes, by ${result.model}` : "no"}`,
      result.instructions ? `Instructions: ${result.instructions}` : null,
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
      ? `Directed by ${result.model}${result.instructions ? ` to "${result.instructions}"` : ""}. Directions: ${result.directions.length ? result.directions.join(", ") : "none needed"}.`
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

async function callTool(params, room, env) {
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
    if (name === "find_voices") {
      const { voices, more } = await findVoices(env.ELEVENLABS_API_KEY, args, env.ELEVENLABS_BASE || undefined);
      const text = voices.length
        ? [`${voices.length} voice${voices.length === 1 ? "" : "s"}${more ? " (more match; narrow the search or raise limit)" : ""}:`,
           ...voices.map(v => `- ${v.name} — ${v.voice_id} — ${[v.gender, v.age?.replace("_", " "), v.accent, v.language].filter(Boolean).join(", ")}` +
             `${v.use_case ? `; ${v.use_case.replace(/_/g, " ")}` : ""}${v.descriptive ? `, ${v.descriptive}` : ""}` +
             `${v.rate ? `; costs ${v.rate}x credits` : ""}${v.description ? `. ${v.description}` : ""}`)].join("\n")
        : "No voices matched. Loosen the filters.";
      return { content: [{ type: "text", text }], structuredContent: { voices, more } };
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

async function handleOne(msg, room, env) {
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
    case "tools/call": return ok(msg.id, await callTool(msg.params, room, env));
    default: return isNotification ? null : fail(msg.id, -32601, `Method not found: ${msg.method}`);
  }
}

export async function handleMcp(request, room, env) {
  if (request.method === "GET" || request.method === "DELETE") {
    return new Response("This server answers POST only.", { status: 405, headers: { Allow: "POST" } });
  }
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let body;
  try { body = await request.json(); } catch { return json(fail(null, -32700, "Parse error"), 400); }
  const batch = Array.isArray(body);
  const replies = [];
  for (const msg of batch ? body : [body]) {
    const reply = await handleOne(msg, room, env);
    if (reply) replies.push(reply);
  }
  if (!replies.length) return new Response(null, { status: 202 });
  return json(batch ? replies : replies[0]);
}

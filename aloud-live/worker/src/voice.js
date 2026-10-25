// Voice commands, for a shortcut on a phone or watch.
//
//   POST /voice/:key   (or /voice with `Authorization: Bearer <key>`)
//
// The body is either a recording (multipart form with one file field, or the
// raw audio bytes) or JSON `{"text": "..."}` for a command already in words.
// A recording is transcribed with ElevenLabs Scribe. Playback commands
// (pause, stop, skip, ...) go straight to the room, which takes well under a
// second; anything else is handed to the Claude Code routine, which picks a
// poem and calls read_aloud through the MCP connector.
//
// Add `?transcribe_only=1` to get the transcript back without acting on it.
//
// The reply is JSON: { heard, did, message, session_url? }. `message` is a
// short sentence meant to be shown as a notification as it stands.

const STT_MODEL = "scribe_v2";
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const MAX_TEXT = 2000;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json" }
});

// Playback commands, in English and Polish, matched only when the whole
// utterance is the command, so "read me something to stop the rain" still
// goes to the routine.
const CONTROL = [
  ["pause", /^(pause|hold on|wait|pauza|zatrzymaj|wstrzymaj)$/],
  ["resume", /^(resume|continue|carry on|play|go on|wznów|kontynuuj|graj|dalej czytaj)$/],
  ["stop", /^(stop|quiet|silence|enough|be quiet|shut up|stop reading|cisza|stop czytania|wystarczy|przestań)$/],
  ["skip", /^(skip|next|next one|next poem|skip it|dalej|następny|następny wiersz|pomiń)$/],
  ["restart", /^(again|restart|start again|from the top|from the beginning|once more|read it again|jeszcze raz|od początku|powtórz)$/]
];

export function matchControl(text) {
  const t = String(text || "")
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")           // audio-event tags such as (laughs)
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/(?<!\p{L})(please|proszę|now|teraz|the poem|the reading|kiosk|aloud)(?!\p{L})/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;
  for (const [action, re] of CONTROL) if (re.test(t)) return action;
  return null;
}

async function readCommand(request) {
  const type = (request.headers.get("Content-Type") || "").toLowerCase();
  if (type.startsWith("application/json")) {
    const body = await request.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    return text ? { text } : { error: "JSON body needs a non-empty `text`." };
  }
  if (type.startsWith("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) return { error: "Could not read the form." };
    for (const [, value] of form) {
      if (typeof value === "object" && value && typeof value.arrayBuffer === "function") {
        return { audio: value, name: value.name || "recording.m4a" };
      }
    }
    const text = form.get("text");
    if (typeof text === "string" && text.trim()) return { text: text.trim() };
    return { error: "The form holds no file. Send the recording as a File field." };
  }
  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength) return { error: "Empty body. Send a recording or JSON {\"text\": ...}." };
  return { audio: new Blob([bytes], { type: type || "audio/mp4" }), name: "recording.m4a" };
}

export async function transcribe(key, audio, name, base = "https://api.elevenlabs.io") {
  const form = new FormData();
  form.append("model_id", STT_MODEL);
  form.append("tag_audio_events", "false");
  form.append("timestamps_granularity", "none");
  form.append("file", audio, name);
  const res = await fetch(`${base}/v1/speech-to-text`, {
    method: "POST", headers: { "xi-api-key": key }, body: form
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Speech recognition failed (${res.status}): ${detail}`);
  }
  const out = await res.json();
  return { text: String(out.text || "").trim(), language: out.language_code || null };
}

async function fireRoutine(env, text) {
  const res = await fetch(env.ROUTINE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.ROUTINE_TOKEN}`,
      "anthropic-version": "2026-10-21",
      "anthropic-beta": "experimental-cc-routine-2026-04-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const why = body?.error?.message || `HTTP ${res.status}`;
    const wait = res.headers.get("Retry-After");
    throw new Error(`The routine refused the command: ${why}${wait ? ` (retry after ${wait}s)` : ""}`);
  }
  return body?.claude_code_session_url || null;
}

export async function handleVoice(request, room, env) {
  if (request.method !== "POST") return json({ error: "POST a recording or JSON {\"text\": ...}." }, 405);
  const url = new URL(request.url);
  const len = Number(request.headers.get("Content-Length") || 0);
  if (len > MAX_AUDIO_BYTES) return json({ error: "Recording too long. Keep it under a minute or so." }, 413);

  const cmd = await readCommand(request);
  if (cmd.error) return json({ error: cmd.error, message: cmd.error }, 400);

  let heard = cmd.text;
  let language = null;
  if (cmd.audio) {
    if (cmd.audio.size > MAX_AUDIO_BYTES) return json({ error: "Recording too long." }, 413);
    try {
      ({ text: heard, language } = await transcribe(env.ELEVENLABS_API_KEY, cmd.audio, cmd.name, env.ELEVENLABS_BASE || undefined));
    } catch (e) {
      return json({ error: e.message, message: "Couldn't transcribe that." }, 502);
    }
  }
  heard = (heard || "").slice(0, MAX_TEXT);
  if (!heard) return json({ heard: "", did: "nothing", message: "Heard nothing." });

  if (url.searchParams.get("transcribe_only")) {
    return json({ heard, language, did: "transcribed", message: `Heard: “${heard}”` });
  }

  const action = matchControl(heard);
  if (action) {
    const result = await room.control(action);
    return json({ heard, language, did: `control:${action}`, message: result.message || action }, result.ok ? 200 : 409);
  }

  if (!env.ROUTINE_URL || !env.ROUTINE_TOKEN) {
    return json({ heard, language, did: "nothing", error: "ROUTINE_URL and ROUTINE_TOKEN are not set on the Worker.",
      message: "Heard you, but the routine isn't connected yet." }, 503);
  }
  try {
    const session_url = await fireRoutine(env, heard);
    return json({ heard, language, did: "routine", session_url, message: `On it: “${heard}”` });
  } catch (e) {
    return json({ heard, language, did: "nothing", error: e.message, message: "The routine didn't start." }, 502);
  }
}

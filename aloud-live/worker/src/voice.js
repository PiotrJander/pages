// Voice commands, for a shortcut on a phone or watch.
//
//   POST /voice/:key   (or /voice with `Authorization: Bearer <key>`)
//
// The body is either a recording (multipart form with one file field, or the
// raw audio bytes) or JSON `{"text": "..."}` for a command already in words.
// Either may also name the routine to fire (see routingFrom below).
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

// Which routine to fire, and where playback commands go, can come with the
// request, so one entry point serves several routines and kiosks:
//   routine        a routine id (trig_…) or its full fire URL
//   routine_token  that routine's bearer token
//   control_url    optional: where bare playback commands are POSTed as
//                  {"action": …}, e.g. https://aloud-stream.pjander2.workers.dev/k/<key>/control
// Without them, the routine in this Worker's secrets is used and playback
// commands go to this Worker's own room.
const FIRE_URL = /^https:\/\/api\.anthropic\.com\/v1\/claude_code\/routines\/(trig_[A-Za-z0-9]+)\/fire$/;
const CONTROL_URL = /^https:\/\/[a-z0-9-]+\.pjander2\.workers\.dev\/[^\s]*$/;

export function routingFrom(get) {
  const str = k => { const v = get(k); return typeof v === "string" && v.trim() ? v.trim() : null; };
  const out = {};
  const routine = str("routine"), token = str("routine_token"), control = str("control_url");
  if (routine || token) {
    const url = /^trig_[A-Za-z0-9]+$/.test(routine || "")
      ? `https://api.anthropic.com/v1/claude_code/routines/${routine}/fire` : routine;
    if (!url || !FIRE_URL.test(url)) return { error: "`routine` must be a routine id (trig_…) or its api.anthropic.com fire URL." };
    if (!token) return { error: "`routine` needs `routine_token` with it." };
    out.routine = { url, token };
  }
  if (control) {
    if (!CONTROL_URL.test(control)) return { error: "`control_url` must be an https URL on pjander2.workers.dev." };
    out.controlUrl = control;
  }
  return out;
}

async function readCommand(request) {
  const type = (request.headers.get("Content-Type") || "").toLowerCase();
  if (type.startsWith("application/json")) {
    const body = await request.json().catch(() => null);
    const routing = routingFrom(k => body?.[k]);
    if (routing.error) return routing;
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    return text ? { text, routing } : { error: "JSON body needs a non-empty `text`." };
  }
  if (type.startsWith("multipart/form-data")) {
    const form = await request.formData().catch(() => null);
    if (!form) return { error: "Could not read the form." };
    const routing = routingFrom(k => form.get(k));
    if (routing.error) return routing;
    for (const [, value] of form) {
      if (typeof value === "object" && value && typeof value.arrayBuffer === "function") {
        return { audio: value, name: value.name || "recording.m4a", routing };
      }
    }
    const text = form.get("text");
    if (typeof text === "string" && text.trim()) return { text: text.trim(), routing };
    return { error: "The form holds no file. Send the recording as a File field." };
  }
  const bytes = await request.arrayBuffer();
  if (!bytes.byteLength) return { error: "Empty body. Send a recording or JSON {\"text\": ...}." };
  return { audio: new Blob([bytes], { type: type || "audio/mp4" }), name: "recording.m4a", routing: {} };
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
    const raw = await res.text().catch(() => "");
    let reason = null;
    try { const d = JSON.parse(raw).detail; reason = typeof d === "string" ? d : d?.message; } catch {}
    const err = new Error(`Speech recognition failed (${res.status}): ${reason || raw.slice(0, 300)}`);
    err.short = /speech_to_text/.test(raw)
      ? "The ElevenLabs key can't do speech-to-text: enable that permission or set ELEVENLABS_STT_KEY."
      : res.status === 401 ? "ElevenLabs rejected the key."
      : `Couldn't transcribe that (ElevenLabs ${res.status}).`;
    throw err;
  }
  const out = await res.json();
  return { text: String(out.text || "").trim(), language: out.language_code || null };
}

async function fireRoutine(routine, text) {
  const res = await fetch(routine.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${routine.token}`,
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
      const key = env.ELEVENLABS_STT_KEY || env.ELEVENLABS_API_KEY;
      ({ text: heard, language } = await transcribe(key, cmd.audio, cmd.name, env.ELEVENLABS_BASE || undefined));
    } catch (e) {
      console.error("voice: transcription failed:", e.message);
      return json({ error: e.message, message: e.short || "Couldn't transcribe that." }, 502);
    }
  }
  heard = (heard || "").slice(0, MAX_TEXT);
  if (!heard) return json({ heard: "", did: "nothing", message: "Heard nothing." });

  if (url.searchParams.get("transcribe_only")) {
    return json({ heard, language, did: "transcribed", message: `Heard: “${heard}”` });
  }

  const { routing } = cmd;
  const own = !routing.routine;           // the routine and room this Worker was set up with
  const action = matchControl(heard);
  if (action && (own || routing.controlUrl)) {
    let result;
    if (routing.controlUrl) {
      try {
        const res = await fetch(routing.controlUrl, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action })
        });
        const body = await res.json().catch(() => ({}));
        result = { ok: res.ok, message: body.message || body.error || `HTTP ${res.status}` };
      } catch (e) { result = { ok: false, message: `The kiosk didn't answer: ${e.message}` }; }
    } else {
      result = await room.control(action);
    }
    return json({ heard, language, did: `control:${action}`, message: result.message || action }, result.ok ? 200 : 409);
  }

  const routine = routing.routine || (env.ROUTINE_URL && env.ROUTINE_TOKEN ? { url: env.ROUTINE_URL, token: env.ROUTINE_TOKEN } : null);
  if (!routine) {
    return json({ heard, language, did: "nothing", error: "No routine: send routine and routine_token, or set ROUTINE_URL and ROUTINE_TOKEN.",
      message: "Heard you, but no routine is connected." }, 503);
  }
  try {
    const session_url = await fireRoutine(routine, heard);
    if (own) await room.announce({ stage: "requested", request: heard });
    return json({ heard, language, did: "routine", session_url, message: `On it: “${heard}”` });
  } catch (e) {
    console.error("voice: routine fire failed:", e.message);
    return json({ heard, language, did: "nothing", error: e.message, message: "The routine didn't start." }, 502);
  }
}

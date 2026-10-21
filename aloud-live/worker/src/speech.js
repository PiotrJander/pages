// ElevenLabs text to speech with per-character timings.

export const MODEL = "eleven_v4";
export const VOICES = { pl: "ozf4fnQ34uFcOcKX71uX", en: "auq43ws1oslv0tO4BDa7" };

// tuned for recitation rather than a steady narrator
export const VOICE_SETTINGS = {
  stability: 0.3, similarity_boost: 0.8, style: 0.5, use_speaker_boost: true, speed: 0.95
};
export const LEAD = "[slowly]";
export const STANZA = "[pause] ";
export const BUDGET = 3000;            // spoken characters per request, tags included

export async function synthesize(key, { text, voice, model = MODEL, base = "https://api.elevenlabs.io" }) {
  const url = `${base}/v1/text-to-speech/${encodeURIComponent(voice)}` +
              `/with-timestamps?output_format=mp3_44100_128`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: model, voice_settings: VOICE_SETTINGS })
  });
  if (!res.ok) {
    let detail = "";
    try {
      const b = await res.json();
      detail = typeof b?.detail === "string" ? b.detail : b?.detail?.message || JSON.stringify(b).slice(0, 200);
    } catch { /* keep it empty */ }
    throw new Error(`ElevenLabs returned ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  const body = await res.json();
  if (!body?.audio_base64) throw new Error("ElevenLabs returned no audio.");
  const bin = atob(body.audio_base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, alignment: body.alignment || body.normalized_alignment || null };
}

/**
 * The fallback: ElevenLabs through OpenRouter, used when a direct call fails
 * (a spent quota, say). OpenRouter returns audio only, without timings, so
 * the caller estimates the highlighting from the audio's length.
 */
export async function synthesizeViaOpenRouter(key, { text, voice, base = "https://openrouter.ai" }) {
  const res = await fetch(`${base}/api/v1/audio/speech`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "Aloud Live" },
    body: JSON.stringify({ model: "elevenlabs/eleven-v4", input: text, voice, response_format: "mp3" })
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenRouter speech returned ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength < 1024) throw new Error("OpenRouter returned no audio.");
  return { bytes, alignment: null, duration: mp3Duration(bytes) };
}

/** Seconds of audio in a constant-bitrate MP3, read from its first frame header. */
export function mp3Duration(bytes) {
  let i = 0;
  if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {            // "ID3" tag: skip it
    i = 10 + ((bytes[6] & 0x7f) << 21 | (bytes[7] & 0x7f) << 14 | (bytes[8] & 0x7f) << 7 | (bytes[9] & 0x7f));
  }
  for (; i + 4 < bytes.length; i++) {
    if (bytes[i] !== 0xff || (bytes[i + 1] & 0xe0) !== 0xe0) continue;
    const version = (bytes[i + 1] >> 3) & 3;                                       // 3 = MPEG-1
    const layer = (bytes[i + 1] >> 1) & 3;                                         // 1 = Layer III
    const index = bytes[i + 2] >> 4;
    if (layer !== 1 || index === 0 || index === 15) continue;
    const kbps = version === 3
      ? [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320][index]
      : [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160][index];
    return Math.round(((bytes.length - i) * 8) / (kbps * 1000) * 1000) / 1000;
  }
  return null;
}

/**
 * Search the ElevenLabs voice library. Library voices can be used by id on a
 * paid plan. Needs the key's "Voices: Read" permission.
 */
export async function findVoices(key, q = {}, base = "https://api.elevenlabs.io") {
  const p = new URLSearchParams({ page_size: String(Math.min(Math.max(Number(q.limit) || 10, 1), 30)) });
  for (const k of ["language", "gender", "age", "accent", "search"]) if (q[k]) p.set(k, String(q[k]).trim().toLowerCase());
  if (q.use_case) p.set("use_cases", String(q.use_case).trim().toLowerCase());
  const res = await fetch(`${base}/v1/shared-voices?${p}`, { headers: { "xi-api-key": key } });
  if (!res.ok) {
    let detail = "";
    try { const b = await res.json(); detail = typeof b?.detail === "string" ? b.detail : b?.detail?.message || ""; } catch {}
    if (/voices_read/.test(detail)) {
      throw new Error("The ElevenLabs key is missing the \"Voices: Read\" permission. Turn it on for the key in ElevenLabs, then search again.");
    }
    throw new Error(`ElevenLabs returned ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  const body = await res.json();
  return {
    more: !!body.has_more,
    voices: (body.voices || []).map(v => ({
      voice_id: v.voice_id, name: v.name, gender: v.gender, age: v.age, accent: v.accent,
      language: v.language, use_case: v.use_case, descriptive: v.descriptive,
      description: (v.description || "").replace(/\s+/g, " ").trim().slice(0, 180) || null,
      preview_url: v.preview_url || null,
      rate: typeof v.rate === "number" && v.rate !== 1 ? v.rate : undefined      // credit multiplier
    }))
  };
}

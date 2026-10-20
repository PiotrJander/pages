// Two model passes through OpenRouter.
//   cleanup: a cheap model lifts the work out of scraped page text.
//   direct:  a stronger model marks the reading with ElevenLabs audio tags.
// Each pass is checked, and its output is discarded if it changed what it
// was not allowed to change.

import { transplantTags, provenance } from "./poem.js";

export const OPENROUTER = "https://openrouter.ai";
export const CLEANUP_MODEL = "openai/gpt-6-luna";
export const DIRECTOR_MODEL = "anthropic/claude-sonnet-5.5";

async function chat(key, { model, system, user, maxTokens, temperature = 0.2, json = false, base = OPENROUTER }) {
  const res = await fetch(`${base}/api/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-Title": "Aloud Live"
    },
    body: JSON.stringify({
      model, temperature, max_tokens: maxTokens,
      ...(json ? { response_format: { type: "json_object" } } : {}),
      messages: [{ role: "system", content: system }, { role: "user", content: user }]
    })
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${model} returned ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
  const body = await res.json();
  return (body?.choices?.[0]?.message?.content || "").trim();
}

const CLEANUP_PROMPT = budget => `You extract a work of literature from text scraped off a web page, so that it can be read aloud.

The page text contains the work plus debris: site navigation, section headings that are not part of the work, bylines, dates, share and subscribe prompts, comments, licence or copyright notices, footnote markers, line numbers, editors' notes, image captions, advertisements.

Reply with one JSON object and nothing else:
{"title": string or null, "author": string or null, "language": two-letter ISO 639-1 code of the work, "text": the work}

"title" is the work's own title. It is often one of the PAGE HEADINGS rather than the PAGE TITLE, which tends to name the site or the post.

Rules for "text":
- Copy the work exactly as it appears: same words, spelling, punctuation, capitalisation and line breaks. Never correct, modernise, translate, paraphrase or complete anything. Every line you output must appear in the page text.
- Separate stanzas or paragraphs with one blank line. Drop indentation. Pages often put each line of a poem in its own block, so a blank line follows every single line: that is page layout, not stanzas, so join those lines and keep blank lines only where the work has real stanza breaks.
- Remove all debris, including the title and author lines, unless the work itself prints them inside its text.
- If a PASSAGE is requested, return only that passage. Otherwise, if the page holds several works, return the first complete one.
- Stay under ${budget} characters. If the work is longer, return a portion from its start (or from the requested passage) that ends at a stanza or paragraph boundary.
- If the page holds no literary work, return "text": "".`;

function parseJsonObject(s) {
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("the cleanup model did not return JSON");
  return JSON.parse(s.slice(a, b + 1));
}

export async function cleanup(key, { page, passage, budget, base }) {
  const user = [
    `PAGE TITLE: ${page.title || "(none)"}`,
    `PAGE BYLINE: ${page.byline || "(none)"}`,
    `PAGE HEADINGS: ${page.headings?.length ? page.headings.join(" | ") : "(none)"}`,
    `PASSAGE: ${passage || "(none)"}`,
    "PAGE TEXT:", "<<<", page.text, ">>>"
  ].join("\n");
  const raw = await chat(key, {
    model: CLEANUP_MODEL, system: CLEANUP_PROMPT(budget), user,
    maxTokens: 8000, temperature: 0, json: true, base
  });
  const out = parseJsonObject(raw);
  const text = typeof out.text === "string" ? out.text.replace(/\r\n?/g, "\n").trim() : "";
  if (!text) {
    throw new Error("No literary work was found on that page. It may be an index or a list of editions, " +
      "or it may load its text with JavaScript. Try a link to the text itself, or pass the text directly.");
  }

  // a cheap model may "helpfully" fix a line; it must not invent one
  const check = provenance(text, page.text);
  if (check.ratio < 0.9) {
    const sample = check.missing.slice(0, 3).map(l => `"${l}"`).join(", ");
    throw new Error(`The cleaned text did not match the page (${check.missing.length} of ${check.lines} lines altered, e.g. ${sample}), so it was not read.`);
  }
  return {
    text,
    title: typeof out.title === "string" && out.title.trim() ? out.title.trim() : null,
    author: typeof out.author === "string" && out.author.trim() ? out.author.trim() : null,
    language: typeof out.language === "string" ? out.language.trim().toLowerCase().slice(0, 2) : null
  };
}

export const DIRECTOR_PROMPT = `You are directing a spoken reading of a poem for a text-to-speech voice.
You insert ElevenLabs audio tags in square brackets to shape how it is read.

Hard rules:
- Return the poem exactly as given: same words, same spelling, same punctuation, same line breaks, same stanza breaks. You may ONLY insert bracketed tags.
- Never remove, reorder, reword or add words. Never add commentary, titles or code fences.

Taste, which matters more than coverage:
- Be sparing. Most lines need nothing. One tag per stanza is plenty, and leaving a stanza bare is often right.
- A reading smothered in directions sounds like a parody of poetry reading. Restraint is the whole job.
- Place a tag immediately before the line or phrase it governs.
- Prefer quiet, structural directions: [softly], [slowly], [drawn out], [whispers], [thoughtful], [wry], [pause].
- Match the poem's own register: irony wants [wry], grief wants [softly], a turn in the argument wants [pause]. Do not impose feeling the poem does not have.
- Never use sound effects, accents, laughter or anything comic unless the poem is itself comic.

Return only the poem.`;

/** The original text carrying the model's tags, or null if it changed the words. */
export async function direct(key, text, base) {
  const out = (await chat(key, {
    model: DIRECTOR_MODEL, system: DIRECTOR_PROMPT, user: text,
    maxTokens: 6000, temperature: 0.7, base
  })).replace(/^\s*```[a-z]*\s*/i, "").replace(/```\s*$/, "").trim();
  return out ? transplantTags(text, out) : null;
}

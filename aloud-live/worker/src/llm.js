// Two model passes through OpenRouter.
//   cleanup: a cheap model lifts the work out of scraped page text.
//   direct:  a stronger model directs the reading with ElevenLabs audio
//            tags, following any instructions — including a translation.
// Their output is trusted as returned.

export const OPENROUTER = "https://openrouter.ai";
export const CLEANUP_MODEL = "openai/gpt-6-luna";
export const DIRECTOR_MODELS = { sonnet: "anthropic/claude-sonnet-5.5", opus: "anthropic/claude-opus-5.5" };

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

function parseJsonObject(s, who) {
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error(`${who} did not return JSON`);
  return JSON.parse(s.slice(a, b + 1));
}

const str = v => (typeof v === "string" && v.trim() ? v.trim() : null);

const CLEANUP_PROMPT = budget => `You extract a work of literature from text scraped off a web page, so that it can be read aloud.

The page text contains the work plus debris: site navigation, section headings that are not part of the work, bylines, dates, share and subscribe prompts, comments, licence or copyright notices, footnote markers, line numbers, editors' notes, image captions, advertisements.

Reply with one JSON object and nothing else:
{"title": string or null, "author": string or null, "language": two-letter ISO 639-1 code of the work, "text": the work}

"title" is the work's own title. It is often one of the PAGE HEADINGS rather than the PAGE TITLE, which tends to name the site or the post.

Rules for "text":
- Copy the work exactly as it appears: same words, spelling, punctuation, capitalisation and line breaks. Never correct, modernise, translate, paraphrase or complete anything.
- Separate stanzas or paragraphs with one blank line. Drop indentation. Pages often put each line of a poem in its own block, so a blank line follows every single line: that is page layout, not stanzas, so join those lines and keep blank lines only where the work has real stanza breaks.
- Remove all debris, including the title and author lines, unless the work itself prints them inside its text.
- If a PASSAGE is requested, return only that passage. Otherwise, if the page holds several works, return the first complete one.
- Stay under ${budget} characters. If the work is longer, return a portion from its start (or from the requested passage) that ends at a stanza or paragraph boundary.
- If the page holds no literary work, return "text": "".`;

export async function cleanup(key, { page, passage, budget, base }) {
  const user = [
    `PAGE TITLE: ${page.title || "(none)"}`,
    `PAGE BYLINE: ${page.byline || "(none)"}`,
    `PAGE HEADINGS: ${page.headings?.length ? page.headings.join(" | ") : "(none)"}`,
    `PASSAGE: ${passage || "(none)"}`,
    "PAGE TEXT:", "<<<", page.text, ">>>"
  ].join("\n");
  const out = parseJsonObject(await chat(key, {
    model: CLEANUP_MODEL, system: CLEANUP_PROMPT(budget), user,
    maxTokens: 8000, temperature: 0, json: true, base
  }), "the cleanup model");
  const text = str(out.text)?.replace(/\r\n?/g, "\n") ?? "";
  if (!text) {
    throw new Error("No literary work was found on that page. It may be an index or a list of editions, " +
      "or it may load its text with JavaScript. Try a link to the text itself, or pass the text directly.");
  }
  return { text, title: str(out.title), author: str(out.author), language: str(out.language)?.toLowerCase().slice(0, 2) ?? null };
}

const DIRECTOR_PROMPT = `You prepare a poem for a spoken reading by a text-to-speech voice, and direct the reading with ElevenLabs audio tags in square brackets.

Reply with one JSON object and nothing else:
{"language": two-letter ISO 639-1 code of the text you return, "title": the new title if you translated or rewrote it, otherwise null, "text": the text to be read, with its tags}

The reader may give INSTRUCTIONS.
- Without instructions, or when they only ask for a way of reading it (a mood, a pace, a persona, irony or satire in the delivery), keep every word, spelling, punctuation mark and line break exactly as given, and only insert tags.
- When they ask for different words (a translation, an adaptation, a parody), write the new text and tag it, keeping the poem's line and stanza structure wherever the change allows. A translation should be faithful and literary: keep the images, the tone and, where it can be done without forcing, the form. Never explain or annotate it.

Directing:
- Place each tag immediately before the line or phrase it governs, never inside a word. Separate stanzas with one blank line.
- Prefer quiet, structural directions: [softly], [slowly], [drawn out], [whispers], [thoughtful], [wry], [pause].
- Restraint is the whole job unless the instructions ask otherwise. Most lines need nothing; one tag per stanza is plenty, and leaving a stanza bare is often right. A reading smothered in directions sounds like a parody of poetry reading.
- Match the poem's own register: irony wants [wry], grief wants [softly], a turn in the argument wants [pause]. Do not impose feeling the poem does not have.
- No sound effects, accents, laughter or anything comic unless the poem is itself comic or the instructions ask for it. When they ask for something theatrical or comic, bolder and more frequent tags are fine.`;

/** The text to read with its tags, and its language and title if they changed. */
export async function direct(key, { text, instructions, model = DIRECTOR_MODELS.sonnet, base }) {
  const user = `INSTRUCTIONS: ${instructions || "(none)"}\n\nPOEM:\n<<<\n${text}\n>>>`;
  const out = parseJsonObject(await chat(key, {
    model, system: DIRECTOR_PROMPT, user, maxTokens: 8000, temperature: 0.7, base
  }), "the director");
  const directed = str(out.text)?.replace(/\r\n?/g, "\n").replace(/^```[a-z]*\s*|```$/g, "").trim();
  if (!directed) throw new Error("the director returned no text");
  return { text: directed, language: str(out.language)?.toLowerCase().slice(0, 2) ?? null, title: str(out.title) };
}

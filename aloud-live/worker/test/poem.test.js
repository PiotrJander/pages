import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  compose, parse, sameShape, buildBundle, fitBudget, provenance, transplantTags,
  detectForm, detectTitle, guessLanguage, stripTags
} from "../src/poem.js";

const OPTS = { lead: "[slowly]", stanza: "[pause] " };

// a synthetic alignment: every spoken character lasts exactly 0.1s
const synthetic = spoken => {
  const chars = [...spoken];
  return {
    characters: chars,
    character_start_times_seconds: chars.map((_, i) => +(i * 0.1).toFixed(3)),
    character_end_times_seconds: chars.map((_, i) => +((i + 1) * 0.1).toFixed(3))
  };
};

test("tags are spoken but never displayed, and are recorded as directions", () => {
  const c = compose("One line here,\n\n[wry] Second stanza [softly] turns.", OPTS);
  assert.equal(c.display, "One line here,\n\nSecond stanza turns.");
  assert.ok(c.spoken.startsWith("[slowly] One line here,"));
  assert.ok(c.spoken.includes("[pause] [wry] Second"));
  assert.deepEqual(c.directions.map(d => d.text), ["[wry]", "[softly]"]);
  assert.ok(!/[\[\]]/.test(c.display));
});

test("every displayed character maps to the same character in the spoken text", () => {
  const c = compose("Alpha beta,\n[whispers] gamma delta.\n\nEpsilon.", OPTS);
  for (let i = 0; i < c.display.length; i++) assert.equal(c.spoken[c.d2s[i]], c.display[i]);
});

test("sameShape ignores tags and whitespace runs but nothing else", () => {
  assert.ok(sameShape("A line,\nanother.", "[wry] A  line,\nanother."));
  assert.ok(!sameShape("A line,\nanother.", "A line,\nanother!"));
  assert.ok(!sameShape("A line,\nanother.", "A line, another."));
});

test("a real ElevenLabs v4 alignment yields exact word times", () => {
  const fx = JSON.parse(readFileSync(new URL("./fixtures/v4-alignment.json", import.meta.url)));
  const { bundle } = buildBundle({ id: "x", source: fx.text, alignment: fx.alignment, lang: "en" });
  assert.equal(bundle.exact, true);
  const words = bundle.stanzas[0].lines[0].words;
  const st = fx.alignment.character_start_times_seconds;
  // "hero:" begins at character index 9 of the text
  const hero = words.find(w => w.t === "hero:");
  assert.equal(hero.s, Math.round(st[9] * 1000) / 1000);
  for (let i = 1; i < words.length; i++) assert.ok(words[i].s >= words[i - 1].s);
});

test("with tags in play, each word starts exactly when its first character is spoken", () => {
  const source = "First line of verse,\nsecond line of it;\n\n[wry] Third line, a turn,\nand [softly] the close.";
  const c = compose(source, OPTS);
  const { bundle } = buildBundle({ id: "y", source, alignment: synthetic(c.spoken), ...OPTS, lang: "en" });
  const parsed = parse(c.display);
  const flatWords = bundle.stanzas.flatMap(s => s.lines.flatMap(l => l.words));
  const flatParsed = parsed.lines.flatMap(l => l.words);
  assert.equal(flatWords.length, flatParsed.length);
  flatParsed.forEach((w, i) => {
    const expect = Math.round(c.d2s[w.from] * 0.1 * 1000) / 1000;
    assert.equal(flatWords[i].s, expect, `word "${w.text}"`);
  });
  assert.equal(bundle.exact, true);
  assert.deepEqual(bundle.stanzas[1].lines[0].dirs, ["wry"]);
  assert.deepEqual(bundle.stanzas[1].lines[1].dirs, ["softly"]);
});

test("lines hand over at the next line's first word, and the last stays open", () => {
  const source = "One two,\nthree four.";
  const c = compose(source, OPTS);
  const { bundle } = buildBundle({ id: "z", source, alignment: synthetic(c.spoken), ...OPTS, lang: "en" });
  const [a, b] = bundle.stanzas[0].lines;
  assert.equal(a.start, 0);
  assert.equal(a.end, b.words[0].s);
  assert.equal(b.end, null);
});

test("without an alignment the timeline falls back to proportional and says so", () => {
  const { bundle } = buildBundle({ id: "f", source: "Just one line here.", alignment: null, lang: "en" });
  assert.equal(bundle.exact, false);
  assert.ok(bundle.stanzas[0].lines[0].words.every(w => w.e > w.s));
});

test("fitBudget cuts at a stanza boundary when one fits", () => {
  const stanza = "A line of verse that runs on,\nanother line beneath it.\n";
  const text = Array.from({ length: 40 }, () => stanza).join("\n");
  const { text: cut, truncated } = fitBudget(text, 500, OPTS);
  assert.ok(truncated);
  assert.ok(compose(cut, OPTS).spoken.length <= 500);
  assert.ok(cut.endsWith("beneath it."));
});

test("fitBudget leaves short text alone", () => {
  const r = fitBudget("Short.", 3000, OPTS);
  assert.deepEqual(r, { text: "Short.", truncated: false });
});

test("provenance flags a line the page never contained", () => {
  const page = "Menu Home About\nThe Poem\nFirst line of it,\nsecond line too.\n© 2024 Site";
  assert.equal(provenance("First line of it,\nsecond line too.", page).ratio, 1);
  const bad = provenance("First line of it,\nsecond line, improved.", page);
  assert.equal(bad.ratio, 0.5);
  assert.deepEqual(bad.missing, ["second line, improved."]);
});

test("provenance tolerates curly versus straight quotes", () => {
  assert.equal(provenance("It’s here.", "It's here.").ratio, 1);
});

test("form, title and language heuristics", () => {
  assert.equal(detectForm(parse("Short line,\nshort line.").valueOf()), "verse");
  const prose = "x".repeat(300) + " end.\n\n" + "y".repeat(280) + " end.";
  assert.equal(detectForm(parse(prose)), "prose");
  assert.equal(detectTitle(parse("Ode to Silence\nLine one,\nline two.")), "Ode to Silence");
  assert.equal(detectTitle(parse("Not a title,\nLine one,\nline two.")), null);
  assert.equal(guessLanguage("Litwo! Ojczyzno moja! ty jesteś jak zdrowie."), "pl");
  assert.equal(guessLanguage("I want a hero."), "en");
  assert.equal(stripTags("[wry] a [pause] b"), " a  b");
});

test("transplantTags keeps the original characters and only borrows the tag positions", () => {
  const original = "\u201cLook on my Works,\u201d he said \u2014\nand nothing\u2019s left.";
  const directed = '[slowly] "Look on my works," he said -\nand [softly] nothing\'s left.';
  assert.equal(transplantTags(original, directed),
    "[slowly] \u201cLook on my Works,\u201d he said \u2014\nand [softly] nothing\u2019s left.");
});

test("transplantTags refuses a reworded line", () => {
  assert.equal(transplantTags("the lone and level sands", "[wry] the lone and endless sands"), null);
  assert.equal(transplantTags("one two three", "[pause] one two"), null);
});

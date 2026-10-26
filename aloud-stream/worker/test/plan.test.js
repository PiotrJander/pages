import { test } from "node:test";
import assert from "node:assert/strict";
import { numbered, locate, applyTags, resolve, layout, StreamTimer, loose } from "../src/plan.js";

// an invented page: chrome, two short poems, more chrome
const PAGE = [
  "Home | Poems | About",
  "Low Tide",
  "The sea goes out the way a thought goes out,",
  "not all at once, but leaving things behind:",
  "",
  "a rope, a shell, the outline of a doubt",
  "still glistening where the water was resigned.",
  "",
  "Night Shift",
  "The building hums a note below the ear;",
  "the vending light keeps vigil by the stair.",
  "Share this poem"
];

test("numbered lines, a window and a search", () => {
  assert.equal(numbered(PAGE)[2], "3| The sea goes out the way a thought goes out,");
  assert.deepEqual(numbered(PAGE, { from: 5, to: 6 }), ["5| ", "6| a rope, a shell, the outline of a doubt"]);
  assert.deepEqual(numbered(PAGE, { find: "VENDING" }), ["11| the vending light keeps vigil by the stair."]);
});

test("loose matching ignores case, quotes, punctuation and tags", () => {
  assert.equal(loose("“Not all at once,” — BUT"), "not all at once but");
  assert.equal(loose("[softly] a rope"), "a rope");
});

test("locate by first and last line, partial and loose", () => {
  assert.deepEqual(locate(PAGE, { firstLine: "The sea goes out", lastLine: "still glistening where the water" }),
    { start: 3, end: 7, notes: [] });
  // the last line is searched only after the first
  assert.equal(locate(PAGE, { firstLine: "the building hums", lastLine: "vending light" }).end, 11);
});

test("text wins, numbers break ties and stand in", () => {
  const twice = ["x", "Again, again", "one", "Again, again", "two"];
  assert.equal(locate(twice, { firstLine: "again again", lastLine: "two", from: 4 }).start, 4);
  const r = locate(PAGE, { firstLine: "not on this page", from: 3, to: 7 });
  assert.deepEqual([r.start, r.end], [3, 7]);
  assert.match(r.notes[0], /not found/);
  assert.throws(() => locate(PAGE, { firstLine: "nowhere" }), /starts/);
  assert.throws(() => locate(PAGE, { firstLine: "The sea goes out" }), /ends/);
});

test("tags go before the named word, later ones first", () => {
  const { lines, notes } = applyTags(["one two three", "", "four five"], [
    { line: 1, tag: "[softly]" }, { line: 1, word: 3, tag: "[pause]" },
    { line: 2, tag: "[x]" }, { line: 3, word: 9, tag: "[slowly]" }, { line: 3, tag: "no brackets" }
  ]);
  assert.deepEqual(lines, ["[softly] one two [pause] three", "", "four [slowly] five"]);
  assert.equal(notes.length, 2);
});

test("resolve: page lines to tagged source, words untouched", () => {
  const r = resolve({ url: "x", firstLine: "The sea goes out", lastLine: "still glistening",
    tags: [{ line: 3, tag: "[wistful]" }, { line: 10, tag: "[outside]" }] }, PAGE);
  assert.ok(r.source.startsWith("[wistful] The sea goes out"));
  assert.ok(r.source.endsWith("was resigned."));
  assert.ok(!r.source.includes("Home") && !r.source.includes("Night Shift"));
  assert.ok(r.notes.some(n => /outside/.test(n)));
});

test("resolve: own text for translations", () => {
  const r = resolve({ text: "Raz dwa\ntrzy cztery", tags: [{ line: 2, tag: "[cicho]" }] });
  assert.equal(r.source, "Raz dwa\n[cicho] trzy cztery");
  assert.throws(() => resolve({}), /url/);
});

test("layout numbers words in reading order and keeps directions off the verse", () => {
  const lay = layout("[softly] One two\nthree\n\nfour", { title: "T" });
  const words = lay.poem.stanzas.flatMap(s => s.lines.flatMap(l => l.words));
  assert.deepEqual(words.map(w => [w.i, w.t]), [[0, "One"], [1, "two"], [2, "three"], [3, "four"]]);
  assert.deepEqual(lay.poem.stanzas[0].lines[0].dirs, ["softly"]);
  assert.equal(lay.poem.stanzas.length, 2);
  assert.ok(lay.comp.spoken.includes("[pause]"), "stanza break is spoken as a pause");
});

test("StreamTimer releases words as their alignment arrives, then the rest", () => {
  const lay = layout("one two three");
  const sp = lay.comp.spoken;
  const chars = [...sp];
  const al = (a, b) => ({
    characters: chars.slice(a, b),
    character_start_times_seconds: chars.slice(a, b).map((_, k) => (a + k) * 0.1),
    character_end_times_seconds: chars.slice(a, b).map((_, k) => (a + k + 1) * 0.1)
  });
  const t = new StreamTimer(lay);
  t.add(al(0, 5));                      // "one t"
  assert.deepEqual(t.ready(), [[0, 0, 0.3]]);
  assert.deepEqual(t.ready(), [], "nothing twice");
  t.add(al(5, 9));                      // "wo t"
  assert.deepEqual(t.ready().map(w => w[0]), [1]);
  const rest = t.finish(1.4);
  assert.deepEqual(rest.map(w => w[0]), [2]);
  assert.ok(rest[0][1] >= 0.8);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractFromHtml } from "../src/extract.js";

const load = n => readFileSync(new URL(`./fixtures/${n}`, import.meta.url), "utf8");

test("blog post: Readability keeps the poem, its line breaks and stanza break", () => {
  const r = extractFromHtml(load("blog.html"));
  assert.equal(r.via, "readability");
  assert.match(r.text, /He climbs the evening one rung at a time,\na wick of patience/);
  assert.match(r.text, /planned\.\n\nAnd no one thanks him/);
  assert.doesNotMatch(r.text, /Popular|Privacy|Subscribe/);
});

test("one div per line keeps one line per line", () => {
  const r = extractFromHtml(load("lines.html"));
  assert.equal(r.via, "readability");
  assert.match(r.text, /goes out,\nnot all at once/);              // one line per line
  assert.match(r.text, /resigned\.\n\nI walk the flats/);          // empty div kept as a stanza break
  assert.match(r.title, /Low Tide/);
  assert.doesNotMatch(r.text, /HomePoets|non-profit archive/);
});

test("a page too thin for Readability falls back to main", () => {
  const r = extractFromHtml(load("sparse.html"));
  assert.equal(r.via, "main");
  assert.equal(r.text, "an old silent pond\na frog jumps into the pond\nsplash! silence again");
});

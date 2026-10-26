// From a page and a small plan to the text that is spoken and shown.
//
// The routine never types a poem out. It reads the page as numbered lines
// (`numbered`), then sends a plan naming where the poem starts and ends and
// where delivery tags go. `resolve` turns that plan into tagged source text,
// using only words that are on the page.

import { compose, parse, directionsByLine, detectForm, detectTitle, charTimes, timeline,
         normalise, undoubleSpace, fitBudget } from "./poem.js";

export const STANZA = "[pause] ";
export const BUDGET = 3000;              // spoken characters per reading, tags included
export const OPTS = { lead: "", stanza: STANZA };
const TAG_OK = /^\[[^\[\]\n]{1,40}\]$/;
const MAX_TAGS = 40;

/** Page text as numbered lines, for the routine to read. */
export function numbered(lines, { from = 1, to = lines.length, find = null } = {}) {
  const out = [];
  if (find) {
    const needle = loose(find);
    lines.forEach((l, i) => { if (needle && loose(l).includes(needle)) out.push(`${i + 1}| ${l}`); });
    return out;
  }
  for (let i = Math.max(1, from); i <= Math.min(lines.length, to); i++) out.push(`${i}| ${lines[i - 1]}`);
  return out;
}

/** Comparable form of a line: case, quotes, dashes, punctuation and spacing ignored. */
export function loose(s) {
  return String(s ?? "").normalize("NFKC").toLowerCase()
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

/**
 * The 1-based [start, end] line range of the poem. Text wins over numbers:
 * firstLine and lastLine are matched loosely (a quoted line may be just its
 * opening words), and `from` / `to` only break ties or stand in when a line
 * isn't given.
 */
export function locate(lines, { firstLine, lastLine, from, to } = {}) {
  const L = lines.map(loose);
  const hit = (want, i) => {
    const w = loose(want);
    return w && L[i] && (L[i] === w || L[i].startsWith(w) || (w.length >= 12 && L[i].includes(w)));
  };
  const nearest = (cands, hint) =>
    cands.length ? (hint ? cands.reduce((a, b) => (Math.abs(b - hint) < Math.abs(a - hint) ? b : a)) : cands[0]) : null;

  let start = null, end = null;
  const notes = [];
  if (firstLine) {
    const c = L.map((_, i) => i).filter(i => hit(firstLine, i)).map(i => i + 1);
    start = nearest(c, from);
    if (!start) notes.push("firstLine was not found on the page" + (from ? `; used line ${from}` : ""));
  }
  start ??= Number.isInteger(from) ? from : null;
  if (!start) throw new Error("Couldn't find where the poem starts: give firstLine as it appears on the page, or from.");

  if (lastLine) {
    const c = L.map((_, i) => i).filter(i => i + 1 >= start && hit(lastLine, i)).map(i => i + 1);
    end = nearest(c, to) ?? null;
    if (!end) notes.push("lastLine was not found after the first line" + (to ? `; used line ${to}` : ""));
  }
  end ??= Number.isInteger(to) ? to : null;
  if (!end) throw new Error("Couldn't find where the poem ends: give lastLine as it appears on the page, or to.");
  if (end < start) throw new Error(`The poem would end (line ${end}) before it starts (line ${start}).`);
  if (start < 1 || end > lines.length) throw new Error(`Lines ${start}-${end} are outside the page (1-${lines.length}).`);
  return { start, end, notes };
}

/**
 * Insert tags into numbered lines. `line` uses the page's numbering;
 * `word` is 1-based and defaults to the start of the line.
 */
export function applyTags(lines, tags = []) {
  const out = lines.slice();
  const notes = [];
  const list = (Array.isArray(tags) ? tags : []).slice(0, MAX_TAGS);
  // later words first, so earlier insertions don't shift later positions
  list.map(t => ({ ...t, word: Number.isInteger(t.word) && t.word > 0 ? t.word : 1 }))
    .sort((a, b) => a.line - b.line || b.word - a.word)
    .forEach(t => {
      const tag = String(t.tag || "").trim();
      const i = t.line - 1;
      if (!TAG_OK.test(tag)) { notes.push(`skipped tag ${JSON.stringify(t.tag)}: write it like [softly]`); return; }
      if (!Number.isInteger(t.line) || !out[i] || !out[i].trim()) { notes.push(`skipped ${tag}: line ${t.line} is empty or missing`); return; }
      const spans = [...out[i].matchAll(/\S+/g)];
      const at = spans[Math.min(t.word, spans.length) - 1].index;
      out[i] = out[i].slice(0, at) + tag + " " + out[i].slice(at);
    });
  return { lines: out, notes };
}

// Reference marks pages put after a line ("[8]", "[a]", "[citation needed]"), which would
// otherwise be taken for delivery tags and spoken.
const FOOTNOTE = /\s*\[(?:\d{1,3}|[a-z]|[ivx]{1,4}|note \d+|nb \d+|citation needed|clarification needed|sic)\]/gi;
export const stripFootnotes = line => line.replace(FOOTNOTE, "");

/** Plan to tagged source text, cut to one reading. */
export function resolve(plan, pageLines = null) {
  if (pageLines) pageLines = pageLines.map(stripFootnotes);
  const notes = [];
  let source;
  if (typeof plan.text === "string" && plan.text.trim()) {
    const lines = normalise(plan.text).split("\n");
    const tagged = applyTags(lines, plan.tags);
    notes.push(...tagged.notes);
    source = tagged.lines.join("\n").trim();
  } else if (pageLines) {
    const { start, end, notes: n } = locate(pageLines, plan);
    notes.push(...n);
    const tagged = applyTags(pageLines, (plan.tags || []).filter(t => t.line >= start && t.line <= end));
    const outside = (plan.tags || []).length - (plan.tags || []).filter(t => t.line >= start && t.line <= end).length;
    if (outside > 0) notes.push(`${outside} tag(s) fell outside lines ${start}-${end} and were dropped`);
    notes.push(...tagged.notes);
    source = undoubleSpace(tagged.lines.slice(start - 1, end).join("\n"));
    notes.unshift(`lines ${start}-${end} of the page`);
  } else {
    throw new Error("Give either url (with firstLine and lastLine) or text.");
  }
  const fitted = fitBudget(source, BUDGET, OPTS);
  if (fitted.truncated) notes.push("longer than one reading: cut at a stanza or line boundary; send the rest as another reading");
  return { source: fitted.text, notes, truncated: fitted.truncated };
}

/**
 * Everything the page needs to lay a poem out before any audio exists:
 * stanzas of lines of words, each word numbered in reading order.
 */
export function layout(source, { title = null, author = null, lang = "en" } = {}) {
  const comp = compose(source, OPTS);
  const parsed = parse(comp.display);
  const dirs = directionsByLine(parsed, comp.directions);
  const stanzas = [];
  let n = 0;
  parsed.lines.forEach((line, i) => {
    (stanzas[line.stanza] ||= { lines: [] }).lines.push({
      indented: line.indented, dirs: dirs[i], words: line.words.map(w => ({ i: n++, t: w.text }))
    });
  });
  const words = parsed.lines.flatMap(l => l.words);
  return {
    comp, parsed, words,
    poem: { title: title || detectTitle(parsed), author, lang, form: detectForm(parsed), stanzas: stanzas.filter(Boolean) }
  };
}

/**
 * Word timings while a stream arrives. Alignment chunks are appended as they
 * come (their times run from the start of the reading); `ready()` returns
 * the words that have become fully timed since the last call, and `finish()`
 * the rest, with any the alignment missed bridged across their neighbours.
 */
export class StreamTimer {
  constructor(lay) {
    this.lay = lay;
    this.al = { characters: [], character_start_times_seconds: [], character_end_times_seconds: [] };
    this.sent = new Set();
  }
  add(alignment) {
    const a = alignment;
    if (!a?.characters?.length) return;
    this.al.characters.push(...a.characters);
    this.al.character_start_times_seconds.push(...a.character_start_times_seconds);
    this.al.character_end_times_seconds.push(...a.character_end_times_seconds);
  }
  ready() {
    const { comp, words } = this.lay;
    const t = charTimes(comp.spoken, this.al);
    if (!t) return [];
    const out = [];
    words.forEach((w, i) => {
      if (this.sent.has(i)) return;
      let s = null, e = null;
      for (let k = w.from; k < w.to && s == null; k++) { const si = comp.d2s[k]; if (si != null) s = t.start[si]; }
      const last = comp.d2s[w.to - 1];
      if (last != null) e = t.end[last];
      if (s != null && e != null) { out.push([i, r3(s), r3(Math.max(e, s + 0.05))]); this.sent.add(i); }
    });
    return out;
  }
  finish(duration) {
    const { comp, parsed, words } = this.lay;
    const al = this.al.characters.length ? this.al : null;
    const { byWord } = timeline(parsed, comp, al, duration);
    const out = [];
    words.forEach((w, i) => {
      if (this.sent.has(i)) return;
      const t = byWord.get(w);
      if (t) out.push([i, r3(t.s), r3(t.e)]);
      this.sent.add(i);
    });
    return out;
  }
}

const r3 = n => Math.round(n * 1000) / 1000;

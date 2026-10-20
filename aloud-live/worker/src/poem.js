// The text pipeline, kept pure so it can be tested without a Worker.
//
// One piece of writing produces two strings: the verse as it appears on
// screen, and the text actually spoken, which carries delivery directions
// in square brackets. A character map between the two lets the exact
// timings ElevenLabs returns for the spoken text land on the words shown.

export const TAG = /\[[^\]\n]*\]/g;

export const stripTags = s => s.replace(TAG, "");

export function normalise(raw) {
  return String(raw ?? "").replace(/\r\n?/g, "\n").replace(/\u00a0/g, " ");
}

/**
 * Split the source into displayed and spoken text.
 * `lead` opens the reading, `stanza` is spoken at each stanza break; neither
 * is shown. Tags written into the source are spoken and recorded as
 * directions so the page can print them in the margin.
 */
export function compose(source, { lead = "", stanza = "" } = {}) {
  const text = normalise(source);
  let display = "", spoken = "";
  const d2s = [], directions = [];
  const both = ch => { d2s[display.length] = spoken.length; display += ch; spoken += ch; };
  const aside = (s, shown) => { if (shown) directions.push({ at: display.length, text: s }); spoken += s; };

  if (lead) aside(lead + " ", false);
  const lines = text.split("\n");
  let pendingBreak = false;

  lines.forEach((line, li) => {
    const last = li === lines.length - 1;
    if (!line.trim()) {
      if (display.trim()) pendingBreak = true;
      if (!last) both("\n");
      return;
    }
    if (pendingBreak && stanza) aside(stanza, false);
    pendingBreak = false;
    let i = 0;
    while (i < line.length) {
      if (line[i] === "[") {
        const close = line.indexOf("]", i);
        if (close > i) {
          aside(line.slice(i, close + 1), true);
          i = close + 1;
          // the space after a tag belongs to the tag when the page would
          // otherwise show a leading or doubled space
          const atGap = !display || display.endsWith("\n") || display.endsWith(" ");
          if (line[i] === " " && atGap) { aside(" ", false); i++; }
          continue;
        }
      }
      both(line[i]); i++;
    }
    if (!last) both("\n");
  });
  return { display, spoken, d2s, directions };
}

/** Lines and words of the displayed text, with character offsets. */
export function parse(display) {
  const stanzas = [];
  let current = [];
  let cursor = 0;
  for (const raw of display.split("\n")) {
    const start = cursor;
    cursor += raw.length + 1;
    const body = raw.trim();
    if (!body) { if (current.length) { stanzas.push(current); current = []; } continue; }
    current.push({
      text: body,
      offset: start + (raw.length - raw.trimStart().length),
      indented: /^(\s{2,}|\t)/.test(raw)
    });
  }
  if (current.length) stanzas.push(current);

  const lines = [];
  stanzas.forEach((stanza, si) => stanza.forEach(line => {
    const words = [];
    let seek = 0;
    for (const w of line.text.split(/\s+/).filter(Boolean)) {
      const at = line.text.indexOf(w, seek);
      seek = at + w.length;
      words.push({ text: w, from: line.offset + at, to: line.offset + at + w.length });
    }
    lines.push({ ...line, length: line.text.length, words, stanza: si });
  }));
  return { stanzas, lines };
}

/** Per-character times for the spoken text, tolerating small drift. */
export function charTimes(spoken, alignment) {
  const chars = alignment?.characters;
  const st = alignment?.character_start_times_seconds;
  const et = alignment?.character_end_times_seconds;
  if (!Array.isArray(chars) || !Array.isArray(st) || !Array.isArray(et)) return null;
  if (!chars.length || chars.length !== st.length || chars.length !== et.length) return null;

  const start = new Array(spoken.length).fill(null);
  const end = new Array(spoken.length).fill(null);
  let ci = 0;
  for (let ri = 0; ri < spoken.length; ri++) {
    const want = spoken[ri];
    const limit = Math.min(chars.length, ci + 24);
    for (let k = ci; k < limit; k++) {
      if (chars[k] === want) { start[ri] = st[k]; end[ri] = et[k]; ci = k + 1; break; }
    }
  }
  return { start, end, last: et[et.length - 1] };
}

/**
 * Word and line times. Exact when the alignment is usable; otherwise spread
 * by word length over an estimated duration, so the page still works.
 */
export function timeline(parsed, comp, alignment) {
  const t = charTimes(comp.spoken, alignment);
  const flat = [];
  for (const line of parsed.lines) for (const word of line.words) {
    let a = null, b = null;
    if (t) {
      for (let i = word.from; i < word.to; i++) {
        const si = comp.d2s[i];
        if (si != null && t.start[si] != null) { a = t.start[si]; break; }
      }
      for (let i = word.to - 1; i >= word.from; i--) {
        const si = comp.d2s[i];
        if (si != null && t.end[si] != null) { b = t.end[si]; break; }
      }
    }
    flat.push({ word, s: a, e: b });
  }

  const matched = flat.filter(w => w.s != null).length;
  const exact = !!t && flat.length > 0 && matched >= flat.length * 0.6;
  const duration = t ? t.last : comp.spoken.length / 14;

  if (!exact) {
    // proportional fallback
    const total = flat.reduce((n, w) => n + w.word.text.length + 1, 0) || 1;
    let run = 0;
    for (const w of flat) {
      w.s = (run / total) * duration;
      run += w.word.text.length + 1;
      w.e = (run / total) * duration;
    }
  } else {
    // bridge any word the alignment missed across its neighbours' gap
    for (let i = 0; i < flat.length; i++) {
      if (flat[i].s == null) {
        let p = i - 1; while (p >= 0 && flat[p].e == null) p--;
        let n = i + 1; while (n < flat.length && flat[n].s == null) n++;
        const a = p >= 0 ? flat[p].e : 0;
        const b = n < flat.length ? flat[n].s : duration;
        const slots = n - p;
        flat[i].s = a + (b - a) * ((i - p - 1) / slots);
        flat[i].e = a + (b - a) * ((i - p) / slots);
      }
      if (flat[i].e == null) flat[i].e = flat[i].s + 0.12;
    }
  }
  for (let i = 1; i < flat.length; i++) {
    if (flat[i].s < flat[i - 1].s) flat[i].s = flat[i - 1].s;
    if (flat[i].e <= flat[i].s) flat[i].e = flat[i].s + 0.05;
  }
  const byWord = new Map(flat.map(w => [w.word, w]));
  return { byWord, exact, duration };
}

/** Which displayed line each written direction belongs to. */
export function directionsByLine(parsed, directions) {
  const per = parsed.lines.map(() => []);
  for (const d of directions) {
    let idx = parsed.lines.findIndex(l => l.offset + l.length > d.at);
    if (idx < 0) idx = parsed.lines.length - 1;
    if (idx >= 0) per[idx].push(d.text.replace(/^\[|\]$/g, "").trim());
  }
  return per;
}

/** A short first line with no closing punctuation reads as a title. */
export function detectTitle(parsed) {
  const first = parsed.lines[0];
  if (!first || parsed.lines.length < 3) return null;
  return first.text.length <= 70 && !/[.,;:!?…]$/.test(first.text) ? first.text : null;
}

/**
 * Pages often wrap every line of a poem in its own block, which arrives as a
 * blank line after every line. When every "stanza" is a single line, that is
 * layout rather than form, so the lines are joined into one stanza.
 */
export function undoubleSpace(text) {
  const t = normalise(text).trim();
  const lines = t.split("\n").filter(l => l.trim());
  const blocks = t.split(/\n\s*\n/);
  return lines.length >= 4 && blocks.length === lines.length ? lines.join("\n") : t;
}

/** Long lines mean paragraphs of prose rather than lines of verse. */
export function detectForm(parsed) {
  const lens = parsed.lines.map(l => l.length).sort((a, b) => a - b);
  if (!lens.length) return "verse";
  return lens[Math.floor(lens.length / 2)] > 110 ? "prose" : "verse";
}

export function guessLanguage(text) {
  return /[ąćęłńśźżĄĆĘŁŃŚŹŻ]/.test(text) ? "pl" : "en";
}

/**
 * Shorten the source until its spoken form fits the budget, cutting at the
 * largest boundary that works: stanza, then line, then sentence.
 */
export function fitBudget(source, budget, opts) {
  const text = normalise(source).trim();
  if (compose(text, opts).spoken.length <= budget) return { text, truncated: false };
  for (const pattern of [/\n\s*\n/g, /\n/g, /[.!?…]["'”’)]?\s/g]) {
    const cuts = [];
    for (const m of text.matchAll(pattern)) cuts.push(m.index + (pattern.source.startsWith("[") ? m[0].trimEnd().length : 0));
    for (let i = cuts.length - 1; i >= 0; i--) {
      const candidate = text.slice(0, cuts[i]).trim();
      if (candidate && compose(candidate, opts).spoken.length <= budget) return { text: candidate, truncated: true };
    }
  }
  return { text: text.slice(0, Math.max(0, budget - 40)).trim(), truncated: true };
}

/** Everything the page needs to typeset and highlight, nothing it doesn't. */
export function buildBundle({ id, source, alignment, lead, stanza, title, author, lang }) {
  const comp = compose(source, { lead, stanza });
  const parsed = parse(comp.display);
  const { byWord, exact, duration } = timeline(parsed, comp, alignment);
  const dirs = directionsByLine(parsed, comp.directions);

  const flatLines = parsed.lines.map((line, i) => {
    const words = line.words.map(w => {
      const t = byWord.get(w);
      return { t: w.text, s: round(t.s), e: round(t.e) };
    });
    return { i, stanza: line.stanza, indented: line.indented, dirs: dirs[i], words };
  });
  flatLines.forEach((line, i) => {
    line.start = i === 0 ? 0 : line.words[0]?.s ?? 0;
    line.end = i + 1 < flatLines.length ? (flatLines[i + 1].words[0]?.s ?? null) : null;
  });

  const stanzas = [];
  for (const line of flatLines) {
    (stanzas[line.stanza] ||= { lines: [] }).lines.push({
      indented: line.indented, dirs: line.dirs, start: line.start, end: line.end, words: line.words
    });
  }
  return {
    bundle: {
      id, title: title ?? detectTitle(parsed), author: author ?? null,
      lang, form: detectForm(parsed), exact, duration: round(duration),
      stanzas: stanzas.filter(Boolean)
    },
    spoken: comp.spoken,
    lines: parsed.lines.length
  };
}

const round = n => (n == null ? null : Math.round(n * 1000) / 1000);

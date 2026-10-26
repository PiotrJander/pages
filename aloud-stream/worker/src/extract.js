// Fetch a page and pull out its main text, keeping line and stanza breaks.
//
// Readability (the algorithm behind Firefox Reader View) finds the main
// content on most article-shaped pages. When it finds nothing useful, fall
// back to the first of article / main / [role=main] / body with obvious
// chrome removed. The cleanup model deals with whatever debris survives.

import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";

const FETCH_TIMEOUT_MS = 15000;
const MAX_HTML = 3_000_000;
export const EXTRACT_LIMIT = 120_000;

const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "SVG", "IFRAME", "BUTTON",
  "SELECT", "INPUT", "TEXTAREA", "CANVAS", "VIDEO", "AUDIO", "OBJECT", "EMBED"]);
const CHROME = "nav, header, footer, aside, form, [role=navigation], [role=banner], " +
  "[role=contentinfo], [role=complementary], [aria-hidden=true]";
const PARA = new Set(["P", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "PRE", "FIGURE",
  "TABLE", "UL", "OL", "SECTION", "ARTICLE", "HR"]);
const BLOCK = new Set([...PARA, "ADDRESS", "ASIDE", "DD", "DIV", "DL", "DT", "FIELDSET",
  "FIGCAPTION", "FOOTER", "HEADER", "LI", "MAIN", "NAV", "TBODY", "THEAD", "TFOOT", "TR"]);

/**
 * Text of a DOM subtree with <br> as a line break and blocks as boundaries.
 * Breaks collapse rather than pile up, so a run of one-line <div>s stays one
 * line apart, while an empty block between them still marks a stanza.
 *
 * With a `filter`, only content counts: text directly inside an element the
 * extractor kept, or text inside a kept container that the extractor's own
 * output contains (it rebuilds some elements without their ids).
 */
export function toText(root, filter = null) {
  let out = "";
  let need = 0;                                   // 1 = new line, 2 = blank line
  const breakAt = level => { need = Math.max(need, level); };
  const emit = text => {
    if (out && need) out += need >= 2 ? "\n\n" : "\n";
    need = 0;
    out += text;
  };
  const squash = t => t.replace(/\s+/g, " ").trim();

  const walk = (node, pre, under, parentKept) => {
    if (node.nodeType === 3) {
      const text = pre ? node.data : node.data.replace(/\s+/g, " ");
      if (!text.trim()) {
        if ((parentKept || under) && out && !need && !out.endsWith(" ")) out += " ";
        return;
      }
      if (filter && !parentKept && !(under && filter.known(squash(text)))) return;
      emit(text);
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toUpperCase();
    if (SKIP.has(tag)) return;
    const kept = !filter || filter.kept(node);
    const inside = under || kept;
    if (tag === "BR") { if (inside) { if (need) emit(""); out += "\n"; } return; }
    const level = PARA.has(tag) ? 2 : BLOCK.has(tag) ? 1 : 0;
    // an empty block inside the content is a stanza gap
    if (level && !node.textContent.trim() && tag !== "HR") { if (inside) breakAt(2); return; }
    if (level && inside) breakAt(level);
    for (const child of node.childNodes) walk(child, pre || tag === "PRE", inside, kept);
    if (level && inside) breakAt(level);
  };
  walk(root, false, !filter, !filter);
  return out.split("\n").map(l => l.replace(/[ \t]+/g, " ").trim()).join("\n")
    .replace(/\n{3,}/g, "\n\n").trim();
}

/** Give every element the same id in two parses of the same HTML. */
function tagAll(document) {
  let n = 0;
  for (const el of document.querySelectorAll("*")) el.setAttribute("data-aloud", String(n++));
}

export function extractFromHtml(html) {
  const { document } = parseHTML(html);
  const pageTitle = (document.querySelector("title")?.textContent || "").trim() || null;
  // the work's own title is often a heading Readability lifts out of the content
  const headings = [...document.querySelectorAll("h1, h2")].slice(0, 4)
    .map(h => h.textContent.replace(/\s+/g, " ").trim()).filter(Boolean);

  // Readability decides what is content; the untouched original DOM decides
  // how it is laid out, because Readability rewrites one-line <div>s as <p>s
  // and drops the empty blocks that mark stanza breaks.
  try {
    tagAll(document);
    const twin = parseHTML(html).document;
    tagAll(twin);
    const article = new Readability(twin, { charThreshold: 200 }).parse();
    if (article?.content) {
      const kept = new Set([...article.content.matchAll(/data-aloud="(\d+)"/g)].map(m => m[1]));
      const known = (article.textContent || "").replace(/\s+/g, " ");
      const text = toText(document.body, {
        kept: el => kept.has(el.getAttribute("data-aloud")),
        known: t => known.includes(t)
      });
      if (text.length >= 200) {
        return { text, title: article.title || pageTitle, byline: article.byline || null, headings, via: "readability" };
      }
    }
  } catch { /* fall through to the structural fallback */ }

  for (const selector of ["article", "main", "[role=main]", "body"]) {
    const node = document.querySelector(selector);
    if (!node) continue;
    node.querySelectorAll(CHROME).forEach(n => n.remove());
    const text = toText(node);
    if (text.length >= 20 || selector === "body") {
      return { text, title: pageTitle, byline: null, headings, via: selector };
    }
  }
  return { text: "", title: pageTitle, byline: null, headings, via: "none" };
}

export async function extractFromUrl(url) {
  let parsed;
  try { parsed = new URL(url); } catch { throw new Error(`That is not a valid URL: ${url}`); }
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("Only http and https URLs can be read.");

  const res = await fetch(parsed.toString(), {
    redirect: "follow",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AloudReader/1.0; +https://piotrjander.github.io/pages/aloud-stream/)",
      "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5"
    }
  });
  if (!res.ok) throw new Error(`The page answered ${res.status} ${res.statusText}.`);

  const type = (res.headers.get("content-type") || "").toLowerCase();
  const body = (await res.text()).slice(0, MAX_HTML);

  let result;
  if (type.includes("text/plain")) {
    result = { text: body.replace(/\r\n?/g, "\n").trim(), title: null, byline: null, headings: [], via: "plain" };
  } else if (type.includes("html") || type.includes("xml") || /^\s*</.test(body)) {
    result = extractFromHtml(body, parsed.toString());
  } else {
    throw new Error(`That URL serves ${type || "an unknown type"}, not a web page or plain text.`);
  }
  if (!result.text) throw new Error("No readable text was found on that page.");
  return { ...result, text: result.text.slice(0, EXTRACT_LIMIT), url: res.url || parsed.toString() };
}

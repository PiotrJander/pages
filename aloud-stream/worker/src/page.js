// A web page as numbered lines, the way an agent reads it before planning a reading.

import { extractFromUrl } from "./extract.js";
import { numbered } from "./plan.js";

export const MAX_LINES = 400;

export async function pageAsLines({ url, find = null, from = 1, to = null }) {
  if (!url) throw new Error("Give the url of a page holding the poem.");
  const page = await extractFromUrl(String(url));
  const lines = page.text.split("\n");
  from = Number.isInteger(from) && from > 0 ? from : 1;
  const last = Math.min(lines.length, Number.isInteger(to) ? to : from + MAX_LINES - 1, from + MAX_LINES - 1);
  const body = numbered(lines, { from, to: last, find: find || null });
  const head = [
    `url: ${page.url}`,
    page.title ? `title: ${page.title}` : null,
    page.byline ? `byline: ${page.byline}` : null,
    page.headings?.length ? `headings: ${page.headings.join(" | ")}` : null,
    `lines: ${lines.length}` + (find ? ` · ${body.length} contain "${find}"` :
      (from > 1 || last < lines.length ? ` · showing ${from}-${last}; ask for another window or search to see more` : "")),
    "---"
  ].filter(Boolean);
  return [...head, ...body].join("\n") + "\n";
}

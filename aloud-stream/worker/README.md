# Aloud Stream — Worker

The control plane for the kiosk at `../index.html`: one page, one Durable Object, no language
models. An agent reads a web page as numbered lines, then sends a small plan saying where the
poem starts and ends and where delivery tags go; the Worker takes the words from the page itself,
so the agent never types the poem out.

The same operations are an MCP server at `/mcp/<CONTROL_KEY>` (add it as a custom connector,
then include it in a routine): `read_page`, `read_poem` (the plan below as its arguments),
`control`, `status` and `find_voices`. Connector calls reach the Worker through Anthropic's
servers, so a routine needs no network allowlist for it. Plain REST is kept alongside:

```
GET  /k/<CONTROL_KEY>/extract?url=…     the page as numbered lines (&find=word · &from=&to=)
POST /k/<CONTROL_KEY>/read              a plan, as JSON (below)
POST /k/<CONTROL_KEY>/control           {"action": "pause" | "resume" | "restart" | "skip" | "stop"}
GET  /k/<CONTROL_KEY>/status            what the kiosk is doing
GET  /ws                                the kiosk page; it sends {"type":"hello","key":VIEWER_KEY} first
```

A plan:

```json
{
  "url": "https://…", "firstLine": "opening words of the poem", "lastLine": "closing words",
  "title": "…", "author": "…", "language": "en", "mode": "queue",
  "tags": [{ "line": 12, "tag": "[softly]" }, { "line": 20, "word": 3, "tag": "[pause]" }]
}
```

`firstLine` and `lastLine` are matched loosely (case, quotes and punctuation ignored; the
opening words of a line are enough). `from` / `to` line numbers may be added to break ties or
stand in. `tags` use the numbering `extract` printed; `word` is 1-based and defaults to the
line's start. `text` replaces `url` for words that are not on a page, such as a translation.
`dry_run: true` checks a plan without speaking. `mode: "now"` cuts in.

When the kiosk is idle, or the plan says `now`, the reading streams: ElevenLabs
`stream/with-timestamps` as 24 kHz PCM, relayed chunk by chunk with the words each one times.
While the kiosk is reading, a new plan is synthesized whole as MP3, held for the page to fetch,
and queued. The request returns once the audio is complete.

```
npm install
npm test
npx wrangler deploy
npx wrangler secret put ELEVENLABS_API_KEY   # also VIEWER_KEY and CONTROL_KEY
```

`ELEVENLABS_BASE` may point at a mock for local runs.

# Aloud Live — Worker

The control plane for the display at `../index.html`. A Cloudflare Worker routes everything to one
Durable Object (the room) that holds the displays' WebSockets, runs each reading through
extraction → cleanup (gpt-6-luna) → direction (Sonnet 5.5) → ElevenLabs v4 with timestamps, keeps
the audio in memory just long enough for the displays to fetch it, and starts playback once every
display has it. Control is an MCP server at `/mcp/<CONTROL_KEY>`.

Voice commands arrive at `POST /voice/<CONTROL_KEY>`, as a recording (a multipart file field, or
the raw bytes) or as JSON `{"text": "..."}`. Recordings are transcribed with ElevenLabs Scribe.
Bare playback commands such as "stop" or "następny" go straight to the room; anything else is
passed to a Claude Code routine, which chooses a poem and calls `read_aloud` over MCP. The reply
is `{heard, did, message, session_url?}`; `?transcribe_only=1` returns the transcript alone.

```
npm install
npm test                     # pipeline, extraction and voice-command unit tests
npx wrangler deploy
npx wrangler secret put ELEVENLABS_API_KEY   # also OPENROUTER_API_KEY, VIEWER_KEY, CONTROL_KEY,
                                             # ROUTINE_URL and ROUTINE_TOKEN
```

For local runs, `.dev.vars` may set `ELEVENLABS_BASE` and `OPENROUTER_BASE` to point at a mock.

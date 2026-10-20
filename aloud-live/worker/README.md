# Aloud Live — Worker

The control plane for the display at `../index.html`. A Cloudflare Worker routes everything to one
Durable Object (the room) that holds the displays' WebSockets, runs each reading through
extraction → cleanup (gpt-6-luna) → direction (Sonnet 5.5) → ElevenLabs v4 with timestamps, keeps
the audio in memory just long enough for the displays to fetch it, and starts playback once every
display has it. Control is an MCP server at `/mcp/<CONTROL_KEY>`.

```
npm install
npm test                     # pipeline and extraction unit tests
npx wrangler deploy
npx wrangler secret put ELEVENLABS_API_KEY   # also OPENROUTER_API_KEY, VIEWER_KEY, CONTROL_KEY
```

For local runs, `.dev.vars` may set `ELEVENLABS_BASE` and `OPENROUTER_BASE` to point at a mock.

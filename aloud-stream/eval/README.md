# Routine eval harness

Runs the routine prompt (`routine-prompt.md`) in subagents across models and effort levels,
with the Aloud Stream tools wrapped as a logged command instead of an MCP connector.

- `kiosk <tool> '<json>'` calls the live MCP server; `read_poem` is always a dry run and the kiosk
  is simulated as connected, so nothing is spoken and no credits are spent. Each call is appended to
  `$KIOSK_RUN_DIR/calls.jsonl` with its timing. It reads the MCP URL from `.endpoint` (not committed).
- `analyze.py` reads the subagent transcripts and call logs: wall time, time to the first
  `read_poem`, turns, tool calls by kind, stray tools, and the poems read with their tags.

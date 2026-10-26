"""Metrics per eval run, from the subagent transcripts and the harness call logs.

Prints one row per run: wall time, time to first read_poem, model turns, tool calls by kind,
output tokens, thinking characters, read_poem calls (accepted / errors) and the poems read
with their line counts and tags. Never prints page text.
"""
import json, sys, re, os
from datetime import datetime

T = "/tmp/claude-0/-home-claude/13ddf6ac-5e5a-5af4-abe1-0c9c256c3bb2/tasks/"
agents = json.load(open("/home/claude/eval/agents.json"))
ts = lambda s: datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp()
only = sys.argv[1] if len(sys.argv) > 1 else ""

def run(rid, aid):
    path = T + aid + ".output"
    if not os.path.exists(path): return None
    rows = [json.loads(l) for l in open(path) if l.strip()]
    times = [ts(r["timestamp"]) for r in rows if r.get("timestamp")]
    turns = out_tok = think = 0
    tools = {}
    stray = []
    finished = False
    for r in rows:
        m = r.get("message") or {}
        if r.get("type") == "assistant":
            turns += 1
            out_tok += (m.get("usage") or {}).get("output_tokens", 0)
            for b in m.get("content") or []:
                if b.get("type") == "thinking": think += len(b.get("thinking", ""))
                if b.get("type") == "tool_use":
                    n = b["name"]
                    if n == "Bash":
                        cmd = b["input"].get("command", "")
                        k = re.search(r"kiosk\"?\s+(read_page|read_poem|control|status|find_voices|--help)", cmd)
                        n = "kiosk:" + (k.group(1) if k else ("?" if "kiosk" in cmd else "other-bash"))
                        if "kiosk" not in cmd: stray.append("bash: " + cmd[:50])
                    elif n not in ("WebSearch", "WebFetch", "SubagentHandback"):
                        stray.append(n)
                    tools[n] = tools.get(n, 0) + 1
                    if n == "SubagentHandback": finished = True
    calls = []
    log = f"/home/claude/eval/runs/{rid}/calls.jsonl"
    if os.path.exists(log): calls = [json.loads(l) for l in open(log)]
    reads = [c for c in calls if c["tool"] == "read_poem"]
    ok = [c for c in reads if not c["isError"]]
    first_read = min((ts(c["t"]) for c in ok), default=None)
    poems = []
    for c in ok:
        a = c["args"]
        lines = re.search(r": (\d+) lines", c["text"])
        poems.append({
            "title": a.get("title"), "author": a.get("author"), "lines": int(lines.group(1)) if lines else None,
            "src": re.sub(r"^https?://(www\.)?", "", a.get("url", "text"))[:45],
            "tags": [t.get("tag") for t in a.get("tags", [])], "voice": a.get("voice"), "lang": a.get("language"),
            "mode": a.get("mode"), "first": (re.search(r"First line: (.*)", c["text"]) or [None, None])[1],
            "last": (re.search(r"Last line: (.*)", c["text"]) or [None, None])[1],
            "notes": re.findall(r"Note: (.*)", c["text"])})
    return {
        "run": rid, "wall_s": round(max(times) - min(times), 1) if times else None,
        "first_read_s": round(first_read - min(times), 1) if first_read and times else None,
        "turns": turns, "out_tok": out_tok, "think_chars": think, "tools": tools,
        "read_ok": len(ok), "read_err": len(reads) - len(ok),
        "errors": [c["text"][:90] for c in calls if c["isError"]],
        "voices": [c["args"] for c in calls if c["tool"] == "find_voices"],
        "stray": stray, "poems": poems, "done": finished or bool(times)}

if __name__ == "__main__":
    res = [r for rid, aid in agents.items() if rid.startswith(only) for r in [run(rid, aid)] if r]
    json.dump(res, open(f"/home/claude/eval/results{('-' + only) if only else ''}.json", "w"), indent=1)
    for r in res:
        t = r["tools"]
        print(f"{r['run']:<16} wall {r['wall_s']:>5}s  1st read {str(r['first_read_s']):>5}s  turns {r['turns']:>2}  out {r['out_tok']:>5}  think {r['think_chars']:>5}  "
              f"search {t.get('WebSearch',0)} fetch {t.get('WebFetch',0)} page {t.get('kiosk:read_page',0)} read {r['read_ok']}/{r['read_ok']+r['read_err']}"
              f"{'  STRAY ' + str(r['stray']) if r['stray'] else ''}")
        for p in r["poems"]:
            print(f"    · {p['title']} — {p['author']} [{p['lines']} lines, {p['src']}] {' '.join(p['tags'])}"
                  f"{' voice=' + p['voice'] if p['voice'] else ''}{' lang=' + p['lang'] if p['lang'] else ''}"
                  f"{' NOTES: ' + '; '.join(p['notes']) if p['notes'] else ''}")
        for e in r["errors"]: print(f"    ! {e}")

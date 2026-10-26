// Eval harness: the Aloud Stream MCP tools as a command, with every call logged.
// read_poem is always a dry run and the kiosk is simulated as connected and idle,
// so nothing is spoken and no credits are spent.
import { readFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
const endpoint = readFileSync(new URL("./.endpoint", import.meta.url), "utf8").trim();
const log = join(process.env.KIOSK_RUN_DIR, "calls.jsonl");
const [tool, raw = "{}"] = process.argv.slice(2);
const t0 = Date.now();
const rpc = async (method, params) => (await (await fetch(endpoint, { method: "POST",
  headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) })).json());
if (!tool || tool === "--help") {
  const tools = (await rpc("tools/list", {})).result.tools;
  console.log(tools.map(t => `## ${t.name}\n${t.description}\narguments: ${JSON.stringify(t.inputSchema.properties)}`).join("\n\n"));
  process.exit(0);
}
let args;
try { args = JSON.parse(raw); } catch (e) { console.log(`Error: the arguments must be one JSON object (${e.message}).`); process.exit(1); }
let text, isError = false;
if (tool === "status") text = "Kiosk connected, sound on; idle.";
else if (tool === "control") text = ["pause", "resume", "restart", "skip", "stop"].includes(args.action) ? `Sent ${args.action} to the display.` : (isError = true, `Unknown action "${args.action}".`);
else {
  if (tool === "read_poem") args = { ...args, dry_run: true };
  const r = await rpc("tools/call", { name: tool, arguments: args });
  text = r.result?.content?.[0]?.text ?? JSON.stringify(r.error || r);
  isError = !!r.result?.isError;
  if (tool === "read_poem" && !isError) text = text.replace(/^Dry run: nothing was spoken\./, "Accepted by the rehearsal kiosk.");
}
appendFileSync(log, JSON.stringify({ t: new Date(t0).toISOString(), ms: Date.now() - t0, tool, args, isError, text }) + "\n");
console.log(isError ? `Error: ${text}` : text);

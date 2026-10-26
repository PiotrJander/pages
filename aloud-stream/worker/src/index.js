// Front door for one kiosk. Plain REST for agents, a WebSocket for the page.
//
//   GET  /ws                         the kiosk page (authenticates with its first message)
//   GET  /audio/:id                  audio for a queued reading
//   GET  /k/:key/extract?url=…       the page as numbered lines   (&find=… · &from=&to=)
//   POST /k/:key/read                a plan (JSON) → reads it on the kiosk
//   POST /k/:key/control             {"action": "pause|resume|restart|skip|stop"}
//   GET  /k/:key/status              what the kiosk is doing
//   POST /mcp/:key                   the same as MCP tools, for a routine's connector
//
// /k/:key/* also accepts `Authorization: Bearer <key>` with the key left out of the path.

import { Room } from "./room.js";
import { pageAsLines } from "./page.js";
import { handleMcp } from "./mcp.js";

export { Room };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function withCors(res) {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v);
  return out;
}
const json = (body, status = 200) => withCors(new Response(JSON.stringify(body, null, 1), {
  status, headers: { "Content-Type": "application/json; charset=utf-8" }
}));
const text = (body, status = 200) => withCors(new Response(body, {
  status, headers: { "Content-Type": "text/plain; charset=utf-8" }
}));

function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function extract(url) {
  const int = k => { const v = parseInt(url.searchParams.get(k), 10); return Number.isFinite(v) ? v : undefined; };
  if (!url.searchParams.get("url")) return text("Add ?url=<page holding the poem>.", 400);
  return text(await pageAsLines({ url: url.searchParams.get("url"), find: url.searchParams.get("find"), from: int("from"), to: int("to") }));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const room = env.ROOM.get(env.ROOM.idFromName("kiosk"));

    if (url.pathname === "/ws") return room.fetch(request);
    if (url.pathname.startsWith("/audio/")) return withCors(await room.fetch(request));

    const mcp = url.pathname.match(/^\/mcp(?:\/([^/]+))?\/?$/);
    if (mcp) {
      const key = mcp[1] || (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!sameSecret(key, env.CONTROL_KEY)) return json({ error: "unauthorized" }, 401);
      return withCors(await handleMcp(request, room, env));
    }

    const m = url.pathname.match(/^\/k(?:\/([^/]+))?\/(extract|read|control|status)\/?$/);
    if (m) {
      const key = m[1] || (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!sameSecret(key, env.CONTROL_KEY)) return json({ error: "unauthorized" }, 401);
      const op = m[2];
      try {
        if (op === "extract") return await extract(url);
        if (op === "status") return json(await room.status());
        if (request.method !== "POST") return json({ error: `POST a JSON body to ${op}.` }, 405);
        let body;
        try { body = await request.json(); } catch { return json({ error: "The body must be JSON." }, 400); }
        if (op === "control") {
          const r = await room.control(body?.action);
          return json(r, r.ok ? 200 : 409);
        }
        const r = await room.read(body || {});
        return json(r, r.sent === false ? 409 : 200);
      } catch (e) {
        console.error(`${op} failed:`, e.message);
        return json({ error: e.message || String(e) }, 400);
      }
    }

    if (url.pathname === "/") return text("Aloud Stream: a reading kiosk. MCP at /mcp/<key>; REST at /k/<key>/extract, read, control, status.\n");
    return text("Not found", 404);
  }
};

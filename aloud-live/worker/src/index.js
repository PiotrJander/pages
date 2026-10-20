// Front door. Everything is routed to a single room by name, so the
// agent's commands and the displays' sockets reach the same object.
//
//   GET  /ws            display socket (authenticates with its first message)
//   GET  /audio/:id     audio for a prepared reading
//   POST /mcp/:key      MCP endpoint; the control key is part of the URL so
//                       it works as a no-auth connector in claude.ai.
//                       `Authorization: Bearer <key>` on /mcp works too.

import { Room } from "./room.js";
import { handleMcp } from "./mcp.js";

export { Room };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, Mcp-Session-Id, MCP-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id"
};

function withCors(res) {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(CORS)) out.headers.set(k, v);
  return out;
}

function sameSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

    const room = env.ROOM.get(env.ROOM.idFromName("main"));

    if (url.pathname === "/ws") return room.fetch(request);
    if (url.pathname.startsWith("/audio/")) return withCors(await room.fetch(request));

    const mcp = url.pathname.match(/^\/mcp(?:\/([^/]+))?\/?$/);
    if (mcp) {
      const key = mcp[1] || (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!sameSecret(key, env.CONTROL_KEY)) {
        return withCors(new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401, headers: { "Content-Type": "application/json" }
        }));
      }
      return withCors(await handleMcp(request, room, env));
    }

    if (url.pathname === "/") {
      return withCors(new Response("Aloud: a reading display controlled over MCP.\n", {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      }));
    }
    return withCors(new Response("Not found", { status: 404 }));
  }
};

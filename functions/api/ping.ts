// functions/api/ping.ts — no-op smoke test.
//
// Hit GET /api/ping to confirm Cloudflare's Functions build (TypeScript
// type-stripping, routing) works in this project before relying on it for
// the real endpoints (e.g. functions/api/list-your-business.ts).

export const onRequestGet = async () => {
  return new Response(JSON.stringify({ ok: true, pong: true }), {
    headers: { "content-type": "application/json" },
  });
};

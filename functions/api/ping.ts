// functions/api/ping.ts — no-op smoke test.
//
// This repo has never deployed a Cloudflare Pages Function before. Deploy
// this alongside the marketplace routes and hit GET /api/ping once to
// confirm Cloudflare's Functions build (TypeScript type-stripping, routing)
// works in this project before relying on it for the real endpoints.

export const onRequestGet = async () => {
  return new Response(JSON.stringify({ ok: true, pong: true }), {
    headers: { "content-type": "application/json" },
  });
};

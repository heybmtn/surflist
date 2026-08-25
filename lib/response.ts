// lib/response.ts — standard JSON response shape for every marketplace endpoint.

export function jsonOk(data: Record<string, unknown> = {}, status = 200): Response {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
  extra: Record<string, unknown> = {}
): Response {
  return new Response(JSON.stringify({ ok: false, error: { code, message, ...extra } }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

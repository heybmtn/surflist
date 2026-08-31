// functions/api/visitors.ts — POST /api/visitors
//
// Live + all-time visitor counts for the header. Uses the existing Pages D1
// binding (`DB`) with visitor_* tables, separate from marketplace listings.
//
// Body: { sessionId: hex string }. Cookie `sl_vid` marks a returning browser
// so total only increments once per browser. Live = distinct sessionIds that
// heartbeated in the last 90s. No IPs or other PII are stored.

import type { D1Database, Env, PagesFunction } from "../../lib/types";
import { jsonError } from "../../lib/response";

const LIVE_WINDOW_MS = 90000;
const COOKIE_NAME = "sl_vid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 730; // ~2 years
const SESSION_RE = /^[a-f0-9]{16,64}$/;

function jsonCounts(live: number, total: number, setCookie?: string): Response {
  const headers = new Headers({
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  if (setCookie) headers.append("set-cookie", setCookie);
  return new Response(JSON.stringify({ ok: true, live: live, total: total }), { headers });
}

function isProdHost(request: Request): boolean {
  const host = new URL(request.url).hostname;
  return host === "surflist.co" || host === "www.surflist.co" || host === "surflist.pages.dev";
}

function hasCookie(header: string, name: string): boolean {
  return header.split(";").some(function (part) {
    return part.trim().split("=")[0] === name;
  });
}

function newVisitorId(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

function errorMessage(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return "Visitor counter failed.";
}

async function ensureSchema(db: D1Database): Promise<void> {
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS visitor_stats (bucket TEXT PRIMARY KEY, total INTEGER NOT NULL DEFAULT 0)"
  ).run();
  await db.prepare(
    "CREATE TABLE IF NOT EXISTS visitor_live (" +
      "bucket TEXT NOT NULL, session_id TEXT NOT NULL, last_seen INTEGER NOT NULL, " +
      "PRIMARY KEY (bucket, session_id))"
  ).run();
  await db.prepare(
    "CREATE INDEX IF NOT EXISTS visitor_live_seen ON visitor_live (bucket, last_seen)"
  ).run();
}

async function bump(db: D1Database, bucket: string, sessionId: string, isNewVisitor: boolean) {
  const now = Date.now();
  const cutoff = now - LIVE_WINDOW_MS;
  const writes = [
    db.prepare(
      "INSERT INTO visitor_stats (bucket, total) VALUES (?, 0) ON CONFLICT(bucket) DO NOTHING"
    ).bind(bucket),
    db.prepare(
      "INSERT INTO visitor_live (bucket, session_id, last_seen) VALUES (?, ?, ?) " +
        "ON CONFLICT(bucket, session_id) DO UPDATE SET last_seen = excluded.last_seen"
    ).bind(bucket, sessionId, now),
    db.prepare("DELETE FROM visitor_live WHERE bucket = ? AND last_seen < ?").bind(bucket, cutoff),
  ];
  if (isNewVisitor) {
    writes.push(db.prepare("UPDATE visitor_stats SET total = total + 1 WHERE bucket = ?").bind(bucket));
  }
  await db.batch(writes);

  const stats = await db.prepare("SELECT total FROM visitor_stats WHERE bucket = ?").bind(bucket).all();
  const liveRow = await db.prepare(
    "SELECT COUNT(*) AS live FROM visitor_live WHERE bucket = ? AND last_seen >= ?"
  ).bind(bucket, cutoff).all();
  const totalRow = stats.results && stats.results[0] ? stats.results[0] as { total: number } : null;
  const liveCount = liveRow.results && liveRow.results[0] ? liveRow.results[0] as { live: number } : null;
  return {
    live: Number(liveCount && liveCount.live) || 0,
    total: Number(totalRow && totalRow.total) || 0,
  };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    if (!env.DB) {
      return jsonError("UNAVAILABLE", "Visitor counter is not configured.", 503);
    }

    const origin = request.headers.get("origin") || "";
    if (origin) {
      try {
        if (new URL(origin).origin !== new URL(request.url).origin) {
          return jsonError("FORBIDDEN", "Unexpected origin.", 403);
        }
      } catch {
        return jsonError("FORBIDDEN", "Unexpected origin.", 403);
      }
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return jsonError("INVALID_BODY", "Expected JSON.", 400);
    }

    const sessionId = String(body.sessionId ?? "").trim().toLowerCase();
    if (!SESSION_RE.test(sessionId)) {
      return jsonError("INVALID_BODY", "Invalid session.", 400);
    }

    const bucket = isProdHost(request) ? "prod" : "preview";
    const isNewVisitor = !hasCookie(request.headers.get("cookie") || "", COOKIE_NAME);

    let counts;
    try {
      counts = await bump(env.DB, bucket, sessionId, isNewVisitor);
    } catch {
      // First request on a fresh DB: create tables and retry once.
      await ensureSchema(env.DB);
      counts = await bump(env.DB, bucket, sessionId, isNewVisitor);
    }

    let setCookie: string | undefined;
    if (isNewVisitor) {
      const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
      setCookie =
        COOKIE_NAME + "=" + newVisitorId() +
        "; Path=/; Max-Age=" + COOKIE_MAX_AGE +
        "; SameSite=Lax; HttpOnly" + secure;
    }

    return jsonCounts(counts.live, counts.total, setCookie);
  } catch (err) {
    console.error("visitors", errorMessage(err));
    return jsonError("COUNTER_FAILED", errorMessage(err), 500);
  }
};

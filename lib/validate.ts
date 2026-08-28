// lib/validate.ts — input validation shared by the Pages Function API routes.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

export function isValidEmail(email: string): boolean {
  return typeof email === "string" && email.length <= 254 && EMAIL_RE.test(email.trim());
}

/** Optional-field URL check (e.g. a business's website) — http(s) only. */
export function isValidUrl(url: string): boolean {
  return typeof url === "string" && url.length <= 500 && URL_RE.test(url.trim());
}

export function clampText(value: unknown, maxLen: number): string {
  return String(value == null ? "" : value).trim().slice(0, maxLen);
}

export function requireNonEmpty(value: unknown, maxLen = 5000): string | null {
  const s = clampText(value, maxLen);
  return s.length > 0 ? s : null;
}

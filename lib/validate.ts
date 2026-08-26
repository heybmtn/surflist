// lib/validate.ts — input validation shared by the marketplace API routes.

export const MAX_PHOTOS = 4;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MIN_PRICE_PENCE = 50; // 50p
export const MAX_PRICE_PENCE = 1_000_000; // £10,000
export const CATEGORIES = ["surfboards", "wetsuits", "accessories", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/.+/i;

export function isValidEmail(email: string): boolean {
  return typeof email === "string" && email.length <= 254 && EMAIL_RE.test(email.trim());
}

/** Optional-field URL check (e.g. a seller's external listing link) — http(s) only. */
export function isValidUrl(url: string): boolean {
  return typeof url === "string" && url.length <= 500 && URL_RE.test(url.trim());
}

export function isValidCategory(category: string): category is Category {
  return (CATEGORIES as readonly string[]).includes(category);
}

export const CONDITIONS = ["mint", "minor_dings_repaired", "needs_repair", "beater"] as const;
export type Condition = (typeof CONDITIONS)[number];

export function isValidCondition(condition: string): condition is Condition {
  return (CONDITIONS as readonly string[]).includes(condition);
}

export const CONDITION_LABELS: Record<Condition, string> = {
  mint: "Mint",
  minor_dings_repaired: "Minor Dings (Repaired)",
  needs_repair: "Needs Repair",
  beater: "Beater",
};

/** Parses a pounds-decimal string (e.g. "24.99") into validated pence, or null. */
export function parsePricePence(poundsInput: string): number | null {
  const pounds = Number(poundsInput);
  if (!Number.isFinite(pounds)) return null;
  const pence = Math.round(pounds * 100);
  if (pence < MIN_PRICE_PENCE || pence > MAX_PRICE_PENCE) return null;
  return pence;
}

export function isValidImageFile(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type) && file.size > 0 && file.size <= MAX_IMAGE_BYTES;
}

export function clampText(value: unknown, maxLen: number): string {
  return String(value == null ? "" : value).trim().slice(0, maxLen);
}

export function requireNonEmpty(value: unknown, maxLen = 5000): string | null {
  const s = clampText(value, maxLen);
  return s.length > 0 ? s : null;
}

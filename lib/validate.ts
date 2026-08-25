// lib/validate.ts — input validation shared by the marketplace API routes.

export const MAX_PHOTOS = 4;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MIN_PRICE_PENCE = 50; // 50p
export const MAX_PRICE_PENCE = 1_000_000; // £10,000
export const CATEGORIES = ["surfboards", "wetsuits", "accessories", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return typeof email === "string" && email.length <= 254 && EMAIL_RE.test(email.trim());
}

export function isValidCategory(category: string): category is Category {
  return (CATEGORIES as readonly string[]).includes(category);
}

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

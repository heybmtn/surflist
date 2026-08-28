// lib/html.ts — small HTML escaping helper shared by the Pages Function API
// routes (re-exported by lib/email.ts for building email bodies).

export function escapeHtml(s: unknown): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

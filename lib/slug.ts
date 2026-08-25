// lib/slug.ts — same slug algorithm as the site's shared.js. Duplicated
// (not imported) so functions/ doesn't reach into a plain-JS file with no
// type declarations; keep the two in sync by hand if either ever changes.

export function slugify(input: string): string {
  return String(input == null ? "" : input)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function makeListingSlug(title: string, id: string): string {
  const base = slugify(title) || "listing";
  return base + "-" + id.slice(0, 8);
}

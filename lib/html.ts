// lib/html.ts — minimal HTML shell for the one Pages Function that renders
// a full page (the marketplace detail route). Mirrors build.js's head() /
// header() / FOOTER markup exactly, so a server-rendered listing page looks
// identical to every statically-generated page on the site. build.js itself
// can't be imported here — it's a Node script with build-time side effects
// (reads every data file, runs validate()) that has no place in a Worker.

export function escapeHtml(s: unknown): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface ShellOptions {
  title: string;
  desc: string;
  canonical: string;
  ogImage?: string;
  jsonld?: string;
  bodyHtml: string;
}

const HEADER =
  '<header><div class="wrap header__inner"><a class="brand" href="/">surflist<span>.</span></a>' +
  '<a class="btn header__cta" href="/list-your-business/">+ Add Your Business</a></div></header>\n';

const FOOTER =
  '<footer><div class="wrap footer-grid">' +
  '<div class="footer-col"><a class="brand" href="/">surflist<span>.</span></a>' +
  '<p>Run a surf school, shop or stay? <a href="/list-your-business/">Get listed</a>.</p></div>' +
  "</div></footer>\n";

export function renderShell(o: ShellOptions): string {
  const head =
    '<!doctype html>\n<html lang="en">\n<head>\n' +
    '<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<meta name="theme-color" content="#0c5c57" />\n' +
    "<title>" + escapeHtml(o.title) + "</title>\n" +
    '<meta name="description" content="' + escapeHtml(o.desc) + '" />\n' +
    '<link rel="canonical" href="' + o.canonical + '" />\n' +
    '<meta property="og:type" content="website" />\n' +
    '<meta property="og:title" content="' + escapeHtml(o.title) + '" />\n' +
    '<meta property="og:description" content="' + escapeHtml(o.desc) + '" />\n' +
    '<meta property="og:url" content="' + o.canonical + '" />\n' +
    (o.ogImage ? '<meta property="og:image" content="' + escapeHtml(o.ogImage) + '" />\n' : "") +
    '<meta name="twitter:card" content="summary_large_image" />\n' +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n' +
    '<link rel="stylesheet" href="/styles.css" />\n' +
    (o.jsonld ? '<script type="application/ld+json">\n' + o.jsonld + "\n</script>\n" : "") +
    "</head>\n";

  return head + "<body>\n" + HEADER + o.bodyHtml + "\n" + FOOTER + "</body>\n</html>\n";
}

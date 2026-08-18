/* build.js — generates a static, SEO/GEO-friendly HTML page for every VERIFIED
   listing, plus sitemap.xml and robots.txt. Free listings stay client-rendered
   from listings.js and get no page. Zero dependencies.

   Run:  node build.js
   On Cloudflare Pages, set the build command to:  node build.js  */

const fs = require("fs");
const path = require("path");
const shared = require("./shared.js");

const ROOT = __dirname;
const SITE = "https://surflist.co"; // change if your domain differs

/* ---------- helpers (kept in sync with the site) ---------- */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

const SOCIAL_ORDER = ["instagram", "facebook", "tiktok", "youtube", "x"];
const SOCIAL_ICONS = {
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.52.01-4.76.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.04-.9-.19-1.39-.32-1.71a2.85 2.85 0 0 0-.69-1.06 2.85 2.85 0 0 0-1.06-.69c-.32-.13-.81-.28-1.71-.32-1.24-.06-1.61-.07-4.76-.07zm0 2.76a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6zm0 1.62a3.68 3.68 0 1 0 0 7.36 3.68 3.68 0 0 0 0-7.36zm5.5-.29a1.24 1.24 0 1 1-2.48 0 1.24 1.24 0 0 1 2.48 0z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.53.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.83L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z"/></svg>',
};

function placeholderImage(seed) {
  var h = 0;
  seed = String(seed || "");
  for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  var hue = 168 + (h % 28);
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="hsl(' + hue + ',42%,34%)"/>' +
    '<stop offset="1" stop-color="hsl(' + (hue + 14) + ',44%,22%)"/></linearGradient></defs>' +
    '<rect width="400" height="300" fill="url(#g)"/>' +
    '<path d="M0 206 C 80 178 140 236 220 210 C 300 186 350 224 400 204 L400 300 L0 300 Z" fill="rgba(255,255,255,0.10)"/>' +
    '<path d="M0 230 C 90 204 150 256 240 234 C 320 216 360 244 400 230 L400 300 L0 300 Z" fill="rgba(255,255,255,0.14)"/>' +
    "</svg>";
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function socialsHtml(socials) {
  if (!socials) return "";
  var links = SOCIAL_ORDER
    .filter(function (k) { return socials[k] && SOCIAL_ICONS[k]; })
    .map(function (k) {
      return '<a class="soc" href="' + esc(socials[k]) + '" target="_blank" rel="noopener" aria-label="' + k + '">' + SOCIAL_ICONS[k] + "</a>";
    })
    .join("");
  return links ? '<div class="socials">' + links + "</div>" : "";
}

/* ---------- load listings from the single source of truth ---------- */
const code = fs.readFileSync(path.join(ROOT, "listings.js"), "utf8");
const win = {};
new Function("window", code)(win);
const LISTINGS = win.LISTINGS || [];
const verified = LISTINGS.filter(function (d) { return d.verified || d.premium; });

/* ---------- schema.org JSON-LD ---------- */
function jsonLd(d) {
  var address = { "@type": "PostalAddress" };
  if (d.streetAddress) address.streetAddress = d.streetAddress;
  if (d.town) address.addressLocality = d.town;
  if (d.region) address.addressRegion = d.region;
  var cc = shared.countryCode(d.country);
  if (cc) address.addressCountry = cc;

  var obj = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: d.name,
    address: address,
  };
  if (d.description || d.blurb) obj.description = d.description || d.blurb;
  if (d.url) obj.url = d.url;
  if (d.image) obj.image = d.image;
  if (typeof d.lat === "number" && typeof d.lng === "number") {
    obj.geo = { "@type": "GeoCoordinates", latitude: d.lat, longitude: d.lng };
  }
  if (d.priceRange) obj.priceRange = d.priceRange;
  var sameAs = SOCIAL_ORDER
    .map(function (k) { return d.socials && d.socials[k]; })
    .filter(Boolean);
  if (sameAs.length) obj.sameAs = sameAs;

  return JSON.stringify(obj, null, 2);
}

/* ---------- page template ---------- */
function fontLinks() {
  return '<link rel="preconnect" href="https://fonts.googleapis.com" />\n' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&display=swap" />';
}

function renderPage(d, slug) {
  var pageUrl = SITE + "/schools/" + slug + "/";
  var place = [d.town, d.region, d.country].filter(Boolean).join(", ");
  var imgAttr = d.image ? esc(d.image) : placeholderImage(d.name);
  var levels = d.levels || [];
  var levelTags = levels.map(function (l) { return '<span class="lvl">' + esc(l) + "</span>"; }).join("");
  var lead = d.name + " is a Surflist-verified surf school in " + place + ".";
  var descText = d.description || d.blurb || "";
  var metaDesc = (descText || lead).slice(0, 155);

  var facts = "";
  function fact(dt, dd) { return "<div><dt>" + dt + "</dt><dd>" + dd + "</dd></div>"; }
  var addrLine = [d.streetAddress, d.town, d.region].filter(Boolean).join(", ");
  if (addrLine) facts += fact("Location", esc(addrLine));
  if (d.country) facts += fact("Country", esc(d.country));
  if (d.priceRange) facts += fact("Price", esc(d.priceRange));
  if (levels.length) facts += fact("Levels", esc(levels.join(", ")));
  if (typeof d.lat === "number" && typeof d.lng === "number") {
    facts += fact("Coordinates", d.lat.toFixed(4) + ", " + d.lng.toFixed(4));
  }

  var cta = d.url
    ? '<a class="btn" href="' + esc(d.url) + '" target="_blank" rel="noopener nofollow">Visit website &rarr;</a>'
    : "";

  return '<!doctype html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="utf-8" />\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
"<title>" + esc(d.name) + " — Surf school in " + esc(d.town) + ", " + esc(d.country) + " | surflist</title>\n" +
'<meta name="description" content="' + esc(metaDesc) + '" />\n' +
'<link rel="canonical" href="' + pageUrl + '" />\n' +
'<meta property="og:type" content="website" />\n' +
'<meta property="og:title" content="' + esc(d.name) + ' — surflist" />\n' +
'<meta property="og:description" content="' + esc(metaDesc) + '" />\n' +
'<meta property="og:url" content="' + pageUrl + '" />\n' +
(d.image ? '<meta property="og:image" content="' + esc(d.image) + '" />\n' : "") +
'<link rel="icon" type="image/svg+xml" href="../../favicon.svg" />\n' +
fontLinks() + "\n" +
'<link rel="stylesheet" href="../../styles.css" />\n' +
'<script type="application/ld+json">\n' + jsonLd(d) + "\n</script>\n" +
"</head>\n" +
"<body>\n" +
"<header>\n  <div class=\"wrap\"><a class=\"brand\" href=\"../../\">surflist<span>.</span></a></div>\n</header>\n" +
'<main class="wrap detail">\n' +
'  <a class="back" href="../../">&larr; All surf schools</a>\n' +
'  <div class="detail__head">\n' +
'    <p class="detail__eyebrow">' + esc(place) + "</p>\n" +
'    <h1 class="detail__title">' + esc(d.name) + "</h1>\n" +
'    <span class="badge-verified inline"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.55 17.6 4.4 12.45l1.4-1.4 3.75 3.75 8-8 1.4 1.4z"/></svg>Surflist verified</span>\n' +
"  </div>\n" +
'  <div class="detail__media"><img src="' + imgAttr + '" alt="' + esc(d.name) + '" /></div>\n' +
'  <div class="detail__grid">\n' +
'    <div class="detail__body">\n' +
'      <p class="detail__lead">' + esc(lead) + "</p>\n" +
(descText ? '      <div class="detail__prose"><p>' + esc(descText) + "</p></div>\n" : "") +
(levelTags ? '      <div class="tags detail__levels">' + levelTags + "</div>\n" : "") +
"    </div>\n" +
'    <aside class="detail__facts">\n' +
"      <h2>Details</h2>\n" +
'      <dl class="facts">' + facts + "</dl>\n" +
"      " + cta + "\n" +
"      " + socialsHtml(d.socials) + "\n" +
"    </aside>\n" +
"  </div>\n" +
"</main>\n" +
'<footer>\n  <div class="wrap">Run a surf school? Email <a href="mailto:hello@surflist.co">hello@surflist.co</a> to get listed — it\'s free.</div>\n</footer>\n' +
"</body>\n</html>\n";
}

/* ---------- write output ---------- */
const schoolsDir = path.join(ROOT, "schools");
fs.rmSync(schoolsDir, { recursive: true, force: true });
fs.mkdirSync(schoolsDir, { recursive: true });

const urls = [SITE + "/"];
verified.forEach(function (d) {
  var slug = d.slug || shared.slugify(d.name);
  var dir = path.join(schoolsDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), renderPage(d, slug));
  urls.push(SITE + "/schools/" + slug + "/");
});

const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(function (u) { return "  <url><loc>" + u + "</loc></url>"; }).join("\n") +
  "\n</urlset>\n";
fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap);

fs.writeFileSync(
  path.join(ROOT, "robots.txt"),
  "User-agent: *\nAllow: /\n\nSitemap: " + SITE + "/sitemap.xml\n"
);

console.log("Built " + verified.length + " verified page(s):");
verified.forEach(function (d) {
  console.log("  /schools/" + (d.slug || shared.slugify(d.name)) + "/");
});
console.log("Wrote sitemap.xml and robots.txt.");

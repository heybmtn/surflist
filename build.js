/* build.js — generates the whole static site from the data files.

   DESTINATION-FIRST ARCHITECTURE
   ------------------------------
   The canonical hub for every place is its geographic page:

       /<country>/                         e.g. /england/
       /<country>/<region>/                e.g. /england/cornwall/
       /<country>/<region>/<town>/         e.g. /england/cornwall/newquay/   <- core SEO asset
       /<country>/<region>/<town>/<cat>/   e.g. /england/cornwall/newquay/surf-schools/

   Alongside the tree, each category has a browse-all page. Every surf school
   gets its own listing page (verified or not). Other categories still only
   write a page for verified listings. Listing URLs stay flat + canonical:

       /surf-schools/            (browse all schools everywhere)
       /surf-schools/<slug>/     (every school's own page)

   Country → Region → Town come straight from the data (the country/region/town
   fields on each listing). "United Kingdom / Europe / Worldwide" is a data-side
   grouping (COUNTRIES.bucket / BUCKET_ORDER) used by --check warnings, never a
   URL segment and not rendered on the homepage, so every canonical path is a
   real place.

   Add a category .......... add data/<x>.js + one CATEGORIES entry
   Add a country/region .... just add listings; optionally add a COUNTRIES /
                             REGIONS entry for an intro + custom slug
   Add town editorial ...... add a TOWN_CONTENT["<c>/<r>/<t>"] entry (beaches,
                             when-to-surf, FAQ). Town hubs render slots for these.

   Real pre-rendered HTML, self-hosted font, zero dependencies. Run: node build.js
*/

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const shared = require("./shared.js");

const ROOT = __dirname;
const SITE = "https://surflist.co"; // change if your domain differs

/* Fingerprint styles.css so a deploy cannot keep serving a previous
   stylesheet to returning visitors. Cloudflare and browsers cache the
   stable /styles.css URL; a content hash in the query string forces a
   refetch whenever the sheet changes. The file itself stays at /styles.css. */
const STYLES_HREF = "/styles.css?" + crypto.createHash("md5")
  .update(fs.readFileSync(path.join(ROOT, "styles.css")))
  .digest("hex").slice(0, 8);

/* ---------- category registry ---------- */
const CATEGORIES = [
  { slug: "surf-schools", title: "Surf schools", singular: "surf school", plural: "surf schools",
    nav: "Surf schools", data: "schools.js", facetField: "levels", facetLabel: "Level",
    intro: "Learn to surf or level up with schools and coaches near the break.",
    schemaType: function () { return "SportsActivityLocation"; } },

  { slug: "surf-shops", title: "Surf shops", singular: "surf shop", plural: "surf shops",
    nav: "Surf shops", data: "shops.js", facetField: "offerings", facetLabel: "Offers",
    intro: "Independent surf shops for boards, wetsuits, rentals and repairs.",
    schemaType: function () { return "SportingGoodsStore"; } },

  { slug: "surf-stays", title: "Places to stay", singular: "place to stay", plural: "places to stay",
    nav: "Surf stays", data: "stays.js", facetField: "stayType", facetLabel: "Type",
    intro: "Surf camps, hostels, eco-pods and campervans close to the waves.",
    schemaType: function (d) { return ({ Camp: "Campground", Hostel: "Hostel" })[d.stayType] || "LodgingBusiness"; } },

  { slug: "surf-services", title: "Surf services", singular: "surf service", plural: "surf services",
    nav: "Surf services", data: "services.js", facetField: "serviceType", facetLabel: "Service",
    intro: "Board repair, ding fixes and other surf services.",
    schemaType: function () { return "LocalBusiness"; } },
];

/* ---------- country registry ----------
   `bucket` is a data-side grouping (United Kingdom / Europe / Worldwide) used
   by --check warnings, never a URL segment and not rendered on the homepage.
   Add a country here to give it an intro and a flag; countries not listed
   still work and default to the "Worldwide" bucket. */
const BUCKET_ORDER = ["United Kingdom", "Europe", "Worldwide"];
const COUNTRIES = [
  { name: "England", bucket: "United Kingdom", flag: "gb-eng",
    intro: "Surf England's south-west — from Cornwall's Atlantic beach breaks to the long sands of North Devon." },
  { name: "Wales", bucket: "United Kingdom", flag: "gb-wls",
    intro: "Surf Wales — the Gower Peninsula's beginner bays, the Blue Flag breaks of Pembrokeshire and the exposed sands of Anglesey." },
  { name: "Scotland", bucket: "United Kingdom", flag: "gb-sct",
    intro: "Surf Scotland — cold, clean and uncrowded, from the world-class reef at Thurso to the learner bays of East Lothian and the white sands of the Hebrides." },
  { name: "Portugal", bucket: "Europe", flag: "pt",
    intro: "Surf Portugal's Atlantic coast — consistent beach breaks and world-class waves from the Lisbon region down to the Algarve." },
  { name: "Spain", bucket: "Europe", flag: "es",
    intro: "Surf Spain — the powerful beach breaks and rivermouth points of the Atlantic north, and the year-round warmth of the Canary Islands, Europe's own Hawaii." },
  { name: "France", bucket: "Europe", flag: "fr",
    intro: "Surf France's southwest — the beach-break coast from the Gironde through the Landes to the Basque Country, home of Hossegor, Europe's surf capital." },
  { name: "Ireland", bucket: "Europe", flag: "ie",
    intro: "Ireland's Wild Atlantic Way delivers cold-water Atlantic surf down the west and south coasts — from the forgiving beach breaks of Donegal and Sligo to the punchier waves of Clare and Waterford. Consistent swell, dramatic scenery, 5/4 wetsuits year-round, and a famously warm welcome." },
  { name: "Indonesia", bucket: "Worldwide", flag: "id",
    intro: "One of the world's great surf nations — from Bali's beach breaks and reef points to Lombok's mellow bays and long sand-bottom beaches, with warm water and rideable waves year-round." },
  { name: "Morocco", bucket: "Worldwide", flag: "ma",
    intro: "One of the most accessible warm-water surf destinations from Europe — centred on Taghazout Bay near Agadir, with world-class right-hand point breaks, year-round sunshine and a dense cluster of surf camps, schools and shops, plus mellower beginner waves up the coast at Essaouira." },
  { name: "Costa Rica", bucket: "Worldwide", flag: "cr",
    intro: "One of the world's great surf destinations, with warm water and remarkably consistent waves on two coasts: the ultra-reliable Pacific — home to beginner-friendly hubs like Tamarindo and Nosara and heavier breaks at Santa Teresa, Dominical and Pavones — and the Afro-Caribbean south around Puerto Viejo, where the Salsa Brava reef fires in winter." },
  { name: "Nicaragua", bucket: "Worldwide", flag: "ni",
    intro: "Central America's largest country and one of its most consistent surf destinations, Nicaragua is known for warm water and offshore winds that blow almost year-round off Lake Nicaragua. The Pacific coast runs from the beach and reef breaks around San Juan del Sur, Popoyo and Playa Gigante in the south to the quieter, remote waves of León and Chinandega in the north." },
  { name: "Mexico", bucket: "Worldwide", flag: "mx",
    intro: "From the Pacific point breaks of Nayarit to Oaxaca's world-class Zicatela and the mellow sand-bottom waves of Baja, Mexico offers warm water and consistent surf year-round for every level." },
  { name: "Thailand", bucket: "Worldwide", flag: "th",
    intro: "Thailand's surf is a seasonal, monsoon-driven secret on the Andaman coast — warm water and mostly gentle, beginner-friendly beach breaks around Phuket and Khao Lak, roughly May to October." },
  { name: "New Zealand", bucket: "Worldwide", flag: "nz",
    intro: "Aotearoa's two main islands face two oceans, with cold-water surf year-round — from the black-sand beach breaks north and south of Auckland to Raglan's famous left point, the Canterbury beach breaks around Christchurch, and the far-south breaks of Dunedin's Otago coast." },
  { name: "USA", bucket: "Worldwide", flag: "us",
    intro: "The birthplace of modern surf culture, with world-class waves spanning California, Hawaii, the East Coast and the Gulf — from Huntington Beach's pier to Oahu's North Shore." },
  { name: "Vietnam", bucket: "Worldwide", flag: "vn",
    intro: "Vietnam's surf runs on the northeast monsoon (roughly September–March), when the central and south-central coast picks up windswell. Da Nang's My Khe beachbreaks are the country's most consistent, with smaller, seasonal scenes around Mui Ne and Nha Trang's Bai Dai Beach." },
];

/* ---------- region registry (optional metadata) ----------
   Regions are discovered from the data automatically; this just lets you set a
   nicer intro or a custom slug. */
const REGIONS = [
  { name: "Cornwall",
    intro: "Surf schools, independent shops, places to stay and board repair across Cornwall." },
  { name: "Devon",
    intro: "Surf schools, independent shops, places to stay and board repair across Devon." },
  { name: "Gower",
    intro: "Surf schools across the Gower Peninsula — Britain's first Area of Outstanding Natural Beauty, with sheltered learner bays and the long sands of Llangennith and Rhossili." },
  { name: "Lisbon",
    intro: "Surf schools and spots around the Lisbon coast — from Ericeira's World Surfing Reserve to the beach breaks of Costa da Caparica and Cascais." },
  { name: "Peniche",
    intro: "Surf schools on the Peniche peninsula and Baleal — some of Europe's most consistent, all-swell surf." },
  { name: "Algarve",
    intro: "Surf schools across the Algarve — powerful west-coast Atlantic breaks and the sheltered south around Lagos and Sagres." },
  { name: "Silver Coast",
    intro: "Surf schools along Portugal's Silver Coast — the powerful central Atlantic beaches around Nazaré, São Pedro de Moel and Figueira da Foz." },
  { name: "Porto",
    intro: "Surf schools around Porto — the consistent beach breaks of Matosinhos, minutes from the city." },
  { name: "Viana do Castelo",
    intro: "Surf schools in Viana do Castelo — the Blue Flag waves of Praia do Cabedelo in Portugal's far north." },
  { name: "Pembrokeshire",
    intro: "Surf schools in Pembrokeshire — Blue Flag beach breaks in the Coast National Park, from Whitesands near St Davids to powerful Freshwater West." },
  { name: "Bridgend",
    intro: "Surf schools around Porthcawl, home to Rest Bay, one of South Wales's most consistent beach breaks." },
  { name: "Anglesey",
    intro: "Surf schools on Anglesey — the sandy, swell-catching beaches around Rhosneigr on the island's exposed west coast." },
  { name: "Yorkshire",
    intro: "Surf schools on the Yorkshire coast — consistent North Sea beach breaks from Saltburn down to Scarborough and Cayton Bay." },
  { name: "East Lothian",
    intro: "Surf schools in East Lothian — Belhaven Bay near Dunbar, the closest surf beach to Edinburgh and one of Scotland's best places to learn." },
  { name: "Caithness",
    intro: "Surf schools on Scotland's far north coast — home to Thurso East, one of Europe's finest reef breaks, plus the learner-friendly sands of Dunnet Bay." },
  { name: "Argyll",
    intro: "Surf schools in Argyll and the Inner Hebrides — the white-sand beaches of Tiree, the 'Hawaii of the North', and the Kintyre breaks at Machrihanish." },
  { name: "Basque Country",
    intro: "Surf schools along the Basque coast — beginner-friendly beach breaks at Zarautz and San Sebastián's Zurriola, and the world-class left of Mundaka." },
  { name: "Cantabria",
    intro: "Surf schools around Somo and Santander — Spain's first surf reserve, with kilometres of consistent, all-level beach break across the bay from the city." },
  { name: "Asturias",
    intro: "Surf schools on the Asturian coast — the long sands of Salinas and the contest waves of Tapia de Casariego, backed by the Picos de Europa." },
  { name: "Canary Islands",
    intro: "Surf schools across the Canaries — 'Europe's Hawaii', with warm water and world-class waves year-round on Fuerteventura, Lanzarote, Tenerife and Gran Canaria." },
  { name: "French Basque Country",
    intro: "Surf schools on the French Basque coast — the birthplace of European surfing, from Biarritz's Côte des Basques to the beaches of Anglet, Guéthary and Saint-Jean-de-Luz." },
  { name: "Landes",
    intro: "Surf schools along the Landes coast — mile after mile of powerful sandbank beach breaks around Hossegor, Europe's surf capital, plus Capbreton and Seignosse." },
  { name: "Gironde",
    intro: "Surf schools in the Gironde — the long Médoc beach breaks at Lacanau, a classic Atlantic surf town north of Bordeaux." },
];

/* ---------- town editorial (the "Surfing in <town>" copy) ----------
   Key each entry by its URL path without slashes at the ends:
       "<country-slug>/<region-slug>/<town-slug>"   e.g. "england/cornwall/newquay"
   All fields are optional. Whatever you provide renders on the town hub; whatever
   you leave out shows as an HTML comment slot in the page source, ready to fill.

     intro:      string — replaces the auto-generated hero intro
     beaches:    [{ name, note }]   -> "Best beaches in <town>"
     whenToSurf: string (paragraphs separated by \n\n) -> "When to surf <town>"
     faq:        [{ q, a }]         -> "<town> FAQ" (also emits FAQPage schema)

   Newquay below is a worked example. Copy the shape for other towns. */
const TOWN_CONTENT = {
  "england/cornwall/newquay": {
    // intro: "Newquay is Cornwall's best-known surf town...",   // <- optional override
    // beaches: [ { name: "…", note: "…" } ],   // <- slot: add a "Best beaches" list
    // whenToSurf: "…",   // <- slot: add a paragraph or two
    // faq: [ { q: "…", a: "…" } ],   // <- slot: add an FAQ
  },
  "portugal/lisbon/ericeira": {
    // beaches: [ { name: "…", note: "…" } ],   // <- slot: add a "Best beaches" list
    // whenToSurf: "…",   // <- slot: add a paragraph or two
    // faq: [ { q: "…", a: "…" } ],   // <- slot: add an FAQ
  },
};

/* ---------- helpers ---------- */
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}
function uniqSorted(arr) {
  return arr.filter(function (v, i) { return arr.indexOf(v) === i; }).sort(function (a, b) { return a.localeCompare(b); });
}
function isVerified(d) { return !!(d.verified || d.premium); }
function slugOf(d) { return d._listingSlug || d.slug || shared.slugify(d.name); }
/* Schools always get a listing page; shops/stays/services stay verified-only. */
function hasListingPage(d, cat) { return cat.slug === "surf-schools" || isVerified(d); }
function listingHref(d, cat) {
  return hasListingPage(d, cat) ? "/" + cat.slug + "/" + slugOf(d) + "/" : (d.url || "");
}
function facetVals(d, cat) {
  var v = d[cat.facetField];
  return Array.isArray(v) ? v.filter(Boolean) : (v ? [v] : []);
}

const SOCIAL_ORDER = ["instagram", "facebook", "tiktok", "youtube", "x"];
const SOCIAL_ICONS = {
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zm0 1.62c-3.15 0-3.52.01-4.76.07-.9.04-1.39.19-1.71.32-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.28.81-.32 1.71-.06 1.24-.07 1.61-.07 4.76s.01 3.52.07 4.76c.04.9.19 1.39.32 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.28 1.71.32 1.24.06 1.61.07 4.76.07s3.52-.01 4.76-.07c.9-.04 1.39-.19 1.71-.32.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.28-.81.32-1.71.06-1.24.07-1.61.07-4.76s-.01-3.52-.07-4.76c-.04-.9-.19-1.39-.32-1.71a2.85 2.85 0 0 0-.69-1.06 2.85 2.85 0 0 0-1.06-.69c-.32-.13-.81-.28-1.71-.32-1.24-.06-1.61-.07-4.76-.07zm0 2.76a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6zm0 1.62a3.68 3.68 0 1 0 0 7.36 3.68 3.68 0 0 0 0-7.36zm5.5-.29a1.24 1.24 0 1 1-2.48 0 1.24 1.24 0 0 1 2.48 0z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.53.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>',
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.83L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64z"/></svg>',
  google: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.6A2.6 2.6 0 1 1 12 6.4a2.6 2.6 0 0 1 0 5.2z"/></svg>',
};
/* each category gets its own gradient identity instead of one uniform teal */
const CATEGORY_PALETTE = {
  "surf-schools": { from: [189, 62, 46], to: [212, 55, 24] },  // turquoise/cyan -> deep ocean blue
  "surf-shops": { from: [32, 78, 52], to: [14, 52, 30] },      // amber/sunset orange -> deep terracotta
  "surf-stays": { from: [152, 36, 40], to: [166, 40, 18] },    // sage/emerald -> deep pine
  "surf-services": { from: [232, 20, 42], to: [230, 34, 15] }, // slate/indigo -> midnight navy
};
function placeholderImage(seed, catSlug) {
  var h = 0; seed = String(seed || "");
  for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  var pal = CATEGORY_PALETTE[catSlug];
  var hue1, sat1, lig1, hue2, sat2, lig2;
  if (pal) {
    var hj = (h % 11) - 5, lj = (h % 7) - 3;
    hue1 = pal.from[0] + hj; sat1 = pal.from[1]; lig1 = pal.from[2] + lj;
    hue2 = pal.to[0] + hj; sat2 = pal.to[1]; lig2 = pal.to[2] + lj;
  } else {
    hue1 = 168 + (h % 28); sat1 = 42; lig1 = 34;
    hue2 = hue1 + 14; sat2 = 44; lig2 = 22;
  }
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="hsl(' + hue1 + ',' + sat1 + '%,' + lig1 + '%)"/>' +
    '<stop offset="1" stop-color="hsl(' + hue2 + ',' + sat2 + '%,' + lig2 + '%)"/></linearGradient></defs>' +
    '<rect width="400" height="300" fill="url(#g)"/>' +
    '<path d="M0 206 C 80 178 140 236 220 210 C 300 186 350 224 400 204 L400 300 L0 300 Z" fill="rgba(255,255,255,0.10)"/>' +
    '<path d="M0 230 C 90 204 150 256 240 234 C 320 216 360 244 400 230 L400 300 L0 300 Z" fill="rgba(255,255,255,0.14)"/></svg>';
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
function socialsHtml(socials, googleUrl) {
  socials = socials || {};
  var links = SOCIAL_ORDER.filter(function (k) { return socials[k] && SOCIAL_ICONS[k]; })
    .map(function (k) { return '<a class="soc" href="' + esc(socials[k]) + '" target="_blank" rel="noopener" aria-label="' + k + '">' + SOCIAL_ICONS[k] + "</a>"; })
    .join("");
  if (googleUrl) links += '<a class="soc soc--google" href="' + esc(googleUrl) + '" target="_blank" rel="noopener" aria-label="Google Business Profile">' + SOCIAL_ICONS.google + "</a>";
  return links ? '<div class="socials">' + links + "</div>" : "";
}

/* ---------- load data ---------- */
function loadData(file) {
  var code = fs.readFileSync(path.join(ROOT, "data", file), "utf8");
  var win = {};
  new Function("window", code)(win);
  return (win.LISTINGS || []).slice().map(function (d) {
    if (typeof d.country === "string") d.country = d.country.trim();
    if (typeof d.region === "string") d.region = d.region.trim();
    if (typeof d.town === "string") d.town = d.town.trim();
    return d;
  }).sort(function (a, b) {
    return (isVerified(b) ? 1 : 0) - (isVerified(a) ? 1 : 0) ||
      a.country.localeCompare(b.country) || a.region.localeCompare(b.region) ||
      a.town.localeCompare(b.town) || a.name.localeCompare(b.name);
  });
}
CATEGORIES.forEach(function (c) { c.items = loadData(c.data); });

/* header stat counts — read once from the loaded data so they stay correct as listings are added */
function categoryCount(slug) {
  var cat = CATEGORIES.find(function (c) { return c.slug === slug; });
  return cat ? cat.items.length : 0;
}
var HEADER_STATS = {
  schools: categoryCount("surf-schools"),
  shops: categoryCount("surf-shops"),
  stays: categoryCount("surf-stays"),
};

/* every (listing, category) pair, for whole-tree passes */
var ALL = [];
CATEGORIES.forEach(function (cat) { cat.items.forEach(function (d) { ALL.push({ d: d, cat: cat }); }); });

/* ---------- data validation ---------- */
(function validate() {
  var bad = [];
  CATEGORIES.forEach(function (cat) {
    cat.items.forEach(function (d) {
      if (!d.country) bad.push(cat.data + ': "' + d.name + '" has no country');
      if (!d.region) bad.push(cat.data + ': "' + d.name + '" has no region');
      if (!d.town) bad.push(cat.data + ': "' + d.name + '" has no town');
    });
  });
  if (bad.length) throw new Error("Every listing needs country, region and town:\n" + bad.join("\n"));
  // warn (don't fail) on countries with no homepage bucket
  uniqSorted(ALL.map(function (x) { return x.d.country; })).forEach(function (c) {
    if (!COUNTRIES.find(function (m) { return m.name === c; }))
      console.warn('  note: country "' + c + '" has no COUNTRIES entry — defaulting to the "Worldwide" homepage group.');
  });
})();

/* ---------- place model ---------- */
function countryMeta(name) { return COUNTRIES.find(function (m) { return m.name === name; }) || { name: name, bucket: "Worldwide" }; }
function countryFlag(name) { return countryMeta(name).flag || ""; }
function flagHtml(name) { var f = countryFlag(name); return f ? '<img class="flag" src="/flags/' + f + '.svg" width="20" height="15" alt="" loading="lazy" decoding="async" /> ' : ""; }
function regionMeta(name) { return REGIONS.find(function (m) { return m.name === name; }) || { name: name }; }
function cSlug(name) { var m = countryMeta(name); return m.slug || shared.slugify(name); }
function rSlug(name) { var m = regionMeta(name); return m.slug || shared.slugify(name); }
function tSlug(name) { return shared.slugify(name); }

function countryUrl(c) { return "/" + cSlug(c) + "/"; }
function regionUrl(c, r) { return "/" + cSlug(c) + "/" + rSlug(r) + "/"; }
function townUrl(c, r, t) { return "/" + cSlug(c) + "/" + rSlug(r) + "/" + tSlug(t) + "/"; }
function townCatUrl(c, r, t, cat) { return townUrl(c, r, t) + cat.slug + "/"; }

function countries() { return uniqSorted(ALL.map(function (x) { return x.d.country; })); }
function regionsIn(c) { return uniqSorted(ALL.filter(function (x) { return x.d.country === c; }).map(function (x) { return x.d.region; })); }
function townsIn(c, r) { return uniqSorted(ALL.filter(function (x) { return x.d.country === c && x.d.region === r; }).map(function (x) { return x.d.town; })); }

function itemsInCountry(c, cat) { return cat.items.filter(function (d) { return d.country === c; }); }
function itemsInRegion(c, r, cat) { return cat.items.filter(function (d) { return d.country === c && d.region === r; }); }
function itemsInTown(c, r, t, cat) { return cat.items.filter(function (d) { return d.country === c && d.region === r && d.town === t; }); }

function countTown(c, r, t) { return CATEGORIES.reduce(function (a, cat) { return a + itemsInTown(c, r, t, cat).length; }, 0); }
function countRegion(c, r) { return CATEGORIES.reduce(function (a, cat) { return a + itemsInRegion(c, r, cat).length; }, 0); }
function countCountry(c) { return CATEGORIES.reduce(function (a, cat) { return a + itemsInCountry(c, cat).length; }, 0); }

/* thin-content guards: a town hub needs >=2 listings; a town-category page needs >=2 */
function townHubExists(c, r, t) { return countTown(c, r, t) >= 2; }
function townCatPageExists(c, r, t, cat) { return itemsInTown(c, r, t, cat).length >= 2; }
function townContent(c, r, t) { return TOWN_CONTENT[cSlug(c) + "/" + rSlug(r) + "/" + tSlug(t)] || {}; }
function townsWithHub(c, r) { return townsIn(c, r).filter(function (t) { return townHubExists(c, r, t); }); }

/* Listing slugs are name-only by default. Duplicate names in the same category
   get a town suffix so two pages never share a path. Remaining collisions fail
   --check (and the build). */
var listingSlugCollisions = [];
var listingSlugDisambiguations = [];
(function assignListingSlugs() {
  CATEGORIES.forEach(function (cat) {
    var pageItems = cat.items.filter(function (d) { return hasListingPage(d, cat); });
    var baseCount = {};
    pageItems.forEach(function (d) {
      var base = d.slug || shared.slugify(d.name);
      baseCount[base] = (baseCount[base] || 0) + 1;
    });
    var used = {};
    cat.items.forEach(function (d) {
      var slug = d.slug || shared.slugify(d.name);
      if (hasListingPage(d, cat) && baseCount[slug] > 1) {
        slug = slug + "-" + tSlug(d.town);
        listingSlugDisambiguations.push(d.name + " (" + d.town + ") → /" + cat.slug + "/" + slug + "/");
      }
      if (hasListingPage(d, cat)) {
        if (used[slug]) {
          listingSlugCollisions.push(
            "/" + cat.slug + "/" + slug + "/ would be used by \"" + used[slug].name + "\" (" + used[slug].town + ") and \"" + d.name + "\" (" + d.town + ")"
          );
        } else {
          used[slug] = d;
        }
      }
      d._listingSlug = slug;
    });
  });
})();

/* ---------- shared chrome ---------- */
function header() {
  return '<header><div class="wrap header__inner"><a class="brand" href="/">surflist<span>.</span></a>' +
    "</div>" +
    '<div class="wrap"><p class="header__stats">' +
    HEADER_STATS.schools + " surf schools · " + HEADER_STATS.shops + " surf shops · " + HEADER_STATS.stays + " places to stay</p></div>" +
    "</header>\n";
}
const FOOTER =
  '<footer><div class="wrap footer-grid">' +
  '<div class="footer-col"><a class="brand" href="/">surflist<span>.</span></a>' +
  '<p>Run a surf school, shop or stay? <a href="/list-your-business/">Get listed</a>.</p></div>' +
  '<div class="footer-col"><nav class="footer-nav" aria-label="Footer"><a href="/about/">About</a></nav></div>' +
  "</div></footer>\n";

function head(o) {
  return '<!doctype html>\n<html lang="en">\n<head>\n' +
    '<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '<meta name="theme-color" content="#0c5c57" />\n' +
    "<title>" + esc(o.title) + "</title>\n" +
    '<meta name="description" content="' + esc(o.desc) + '" />\n' +
    (o.noindex ? '<meta name="robots" content="noindex, nofollow" />\n' : "") +
    '<link rel="canonical" href="' + o.canonical + '" />\n' +
    '<meta property="og:type" content="website" />\n' +
    '<meta property="og:title" content="' + esc(o.title) + '" />\n' +
    '<meta property="og:description" content="' + esc(o.desc) + '" />\n' +
    '<meta property="og:url" content="' + o.canonical + '" />\n' +
    (o.ogImage ? '<meta property="og:image" content="' + esc(o.ogImage) + '" />\n' : "") +
    '<meta name="twitter:card" content="summary_large_image" />\n' +
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n' +
    '<link rel="preload" href="/fonts/hanken-400.woff2" as="font" type="font/woff2" crossorigin />\n' +
    '<link rel="preload" href="/fonts/hanken-700.woff2" as="font" type="font/woff2" crossorigin />\n' +
    '<link rel="stylesheet" href="' + STYLES_HREF + '" />\n' +
    (o.jsonld ? '<script type="application/ld+json">\n' + o.jsonld + "\n</script>\n" : "") +
    '<script type="application/ld+json">\n' + WEBSITE_JSONLD + "\n</script>\n" +
    "</head>\n";
}
const WEBSITE_JSONLD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": SITE + "/#website",
  url: SITE,
  name: "Surflist",
  publisher: { "@id": SITE + "/#organization" },
}, null, 2);

/* ---------- breadcrumbs ---------- */
function crumbs(trail) {
  return '<nav class="crumbs" aria-label="Breadcrumb">' + trail.map(function (c, i) {
    var last = i === trail.length - 1;
    var el = last ? '<span aria-current="page">' + esc(c.name) + "</span>"
      : '<a href="' + esc(c.href) + '">' + esc(c.name) + "</a>";
    return el + (last ? "" : '<span class="crumbs__sep" aria-hidden="true">/</span>');
  }).join("") + "</nav>";
}
function breadcrumbJsonLd(trail) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map(function (c, i) {
      var item = { "@type": "ListItem", position: i + 1, name: c.name };
      if (c.href) item.item = SITE + c.href;
      return item;
    }),
  };
}

/* ---------- card ---------- */
function renderCard(d, cat, nameTag) {
  nameTag = nameTag || "h2";
  var verified = isVerified(d);
  var hasPage = hasListingPage(d, cat);
  var name = esc(d.name);
  var place = [d.town, d.region].filter(Boolean).join(", ");
  var img = d.image ? esc(d.image) : placeholderImage(d.name, cat.slug);
  var vals = facetVals(d, cat);
  var tags = vals.map(function (l) { return '<span class="lvl">' + esc(l) + "</span>"; }).join("");
  var socials = socialsHtml(d.socials);
  var href = listingHref(d, cat);
  var linkText = hasPage ? "View" : "Visit";
  var linkAttrs = hasPage ? "" : ' target="_blank" rel="noopener"';
  var link = href ? '<a class="visit" href="' + esc(href) + '"' + linkAttrs + ">" + linkText + " &rarr;</a>" : "";
  var badge = verified ? '<span class="badge-verified"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.55 17.6 4.4 12.45l1.4-1.4 3.75 3.75 8-8 1.4 1.4z"/></svg>Surflist verified</span>' : "";
  var foot = (socials || link) ? '<div class="card__foot">' + socials + link + "</div>" : "";
  var media = hasPage
    ? '<a href="' + esc(href) + '" aria-label="' + name + '"><img src="' + img + '" alt="' + name + '" loading="lazy"></a>'
    : '<img src="' + img + '" alt="' + name + '" loading="lazy">';
  var nameHtml = hasPage
    ? "<" + nameTag + ' class="card__name"><a class="card__name-link" href="' + esc(href) + '">' + name + "</a></" + nameTag + ">"
    : "<" + nameTag + ' class="card__name">' + name + "</" + nameTag + ">";
  var showBlurb = d.blurb && (verified || cat.slug === "surf-schools");
  var dataFacet = vals.length ? ' data-facet="|' + esc(vals.join("|")) + '|"' : "";
  return '<li class="card' + (verified ? " is-verified" : "") + '" data-country="' + esc(d.country) + '" data-region="' + esc(d.region) + '"' + dataFacet + ">" +
    '<div class="card__media">' + media + badge + "</div>" +
    '<div class="card__body"><span class="card__place">' + esc(place) + "</span>" + nameHtml +
    (showBlurb ? '<p class="card__blurb">' + esc(d.blurb) + "</p>" : "") +
    (tags ? '<div class="card__levels">' + tags + "</div>" : "") + foot + "</div></li>";
}

/* a plain place card (country / region / town) */
function placeCard(name, href, count, index, catSlug) {
  var lazy = (index != null && index < 4) ? "" : ' loading="lazy"';
  var img = placeholderImage(href, catSlug);
  return '<li class="card"><div class="card__media"><a href="' + esc(href) + '" aria-label="' + esc(name) + '">' +
    '<img src="' + img + '" alt="' + esc(name) + '"' + lazy + "></a></div>" +
    '<div class="card__body"><h3 class="card__name"><a class="card__name-link" href="' + esc(href) + '">' + esc(name) + "</a></h3>" +
    '<p class="card__blurb">' + count + " listing" + (count === 1 ? "" : "s") + "</p></div></li>";
}

/* ---------- sidebar + filter (browse-all + town-category) ---------- */
function opt(attr, val, label, count, active) {
  return '<button class="side-opt' + (active ? " is-active" : "") + '" type="button" ' + attr + '="' + esc(val) + '">' +
    esc(label) + (count == null ? "" : ' <span class="n">' + count + "</span>") + "</button>";
}
function renderSidebar(cat, opts) {
  opts = opts || {};
  var items = opts.items || cat.items;
  var html = "";
  var allVals = [];
  items.forEach(function (d) { allVals = allVals.concat(facetVals(d, cat)); });
  var facets = uniqSorted(allVals);
  if (facets.length) {
    var fbtn = opt("data-facet", "All", "All", null, true);
    facets.forEach(function (f) {
      var n = items.filter(function (d) { return facetVals(d, cat).indexOf(f) > -1; }).length;
      fbtn += opt("data-facet", f, f, n, false);
    });
    html += '<p class="filter-label">' + esc(cat.facetLabel) + '</p><div class="side-list" id="facets">' + fbtn + "</div>";
  }
  if (opts.scoped) return '<aside class="sidebar" aria-label="Filter listings">' + html + "</aside>";
  var regions = uniqSorted(items.map(function (d) { return d.region; }));
  if (regions.length > 1) {
    var rbtn = opt("data-region", "All", "All", items.length, true);
    regions.forEach(function (r) {
      rbtn += opt("data-region", r, r, items.filter(function (d) { return d.region === r; }).length, false);
    });
    html += '<p class="filter-label">Region</p><div class="side-list" id="regions">' + rbtn + "</div>";
  }
  var cs = uniqSorted(items.map(function (d) { return d.country; }));
  if (cs.length > 1) {
    var cbtn = opt("data-country", "All", "All", items.length, true);
    cs.forEach(function (c) {
      cbtn += opt("data-country", c, c, items.filter(function (d) { return d.country === c; }).length, false);
    });
    html += '<p class="filter-label">Country</p><div class="side-list" id="countries">' + cbtn + "</div>";
  }
  return '<aside class="sidebar" aria-label="Filter listings">' + html + "</aside>";
}
const FILTER_JS =
"(function(){var box=document.querySelector('.sidebar');if(!box)return;" +
"var F=document.getElementById('facets'),R=document.getElementById('regions'),C=document.getElementById('countries')," +
"cards=[].slice.call(document.querySelectorAll('#list .card'))," +
"el=document.getElementById('count'),noun=el.getAttribute('data-noun'),nounp=el.getAttribute('data-nounp')," +
"st={country:'All',region:'All',facet:'All'};" +
"function act(b,a,v){[].slice.call(b.querySelectorAll('.side-opt')).forEach(function(x){x.classList.toggle('is-active',x.getAttribute(a)===v);});}" +
"function apply(){var n=0;cards.forEach(function(c){var ok=(st.country==='All'||c.getAttribute('data-country')===st.country)&&(st.region==='All'||c.getAttribute('data-region')===st.region)&&(st.facet==='All'||(c.getAttribute('data-facet')||'').indexOf('|'+st.facet+'|')>-1);c.hidden=!ok;if(ok)n++;});" +
"var bits=[];if(st.region!=='All')bits.push(st.region);if(st.country!=='All')bits.push(st.country);var where=bits.length?' in '+bits.join(', '):'';" +
"el.textContent=n+' '+(n===1?noun:nounp)+where;}" +
"if(F){F.addEventListener('click',function(e){var b=e.target.closest('.side-opt');if(!b)return;st.facet=b.getAttribute('data-facet');act(F,'data-facet',st.facet);apply();});}" +
"if(R){R.addEventListener('click',function(e){var b=e.target.closest('.side-opt');if(!b)return;st.region=b.getAttribute('data-region');act(R,'data-region',st.region);apply();});}" +
"if(C){C.addEventListener('click',function(e){var b=e.target.closest('.side-opt');if(!b)return;st.country=b.getAttribute('data-country');act(C,'data-country',st.country);apply();});}" +
"})();";

/* ---------- schema.org helpers ---------- */
function surflistEntity() {
  // stub reference only — the full Organization entity (logo, founder, sameAs) lives on /about
  return {
    "@type": "Organization",
    "@id": SITE + "/#organization",
    name: "Surflist",
    url: SITE,
  };
}
function placeNode(o) {
  // o: {id, name, region, country, town}
  var addr = { "@type": "PostalAddress" };
  if (o.town) addr.addressLocality = o.town;
  if (o.region) addr.addressRegion = o.region;
  var cc = shared.countryCode(o.country); if (cc) addr.addressCountry = cc;
  return { "@type": "Place", "@id": o.id, name: o.name, address: addr };
}
function collectionJsonLd(o) {
  // o: {pageUrl, name, place, trail, extra?}
  var graph = [surflistEntity(), o.place, {
    "@type": "CollectionPage",
    "@id": o.pageUrl,
    url: o.pageUrl,
    name: o.name,
    isPartOf: { "@id": SITE + "/#website" },
    about: { "@id": o.place["@id"] },
    mainEntity: { "@id": o.place["@id"] },
    reviewedBy: { "@id": SITE + "/#organization" },
  }, breadcrumbJsonLd(o.trail)];
  if (o.extra) graph.push(o.extra);
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
}

/* ---------- country hub ---------- */
function renderCountryHub(country) {
  var pageUrl = SITE + countryUrl(country);
  var meta = countryMeta(country);
  var intro = meta.intro || ("Surf destinations across " + country + " — browse by region, then by town.");
  var regions = regionsIn(country);
  var trail = [{ name: "Home", href: "/" }, { name: country }];
  var place = placeNode({ id: pageUrl + "#place", name: country, country: country });

  var cards = regions.map(function (r, i) {
    return placeCard(r, regionUrl(country, r), countRegion(country, r), i);
  }).join("");

  return head({
    title: "Surf Schools, Shops & Stays in " + country + " | surflist",
    desc: intro + " Surf schools, shops, places to stay and services on surflist.",
    canonical: pageUrl,
    jsonld: collectionJsonLd({ pageUrl: pageUrl, name: "Surfing in " + country + " — surflist", place: place, trail: trail }),
  }) +
  "<body>\n" + header() +
  '<main class="wrap">' + crumbs(trail) +
  '<section class="hero"><h1>' + flagHtml(country) + "Surfing in " + esc(country) + "</h1><p>" + esc(intro) + "</p></section>\n" +
  '<section class="hub-cat" id="regions"><div class="hub-cat__head"><h2>Where in ' + esc(country) + "?</h2></div>" +
  '<ul class="grid">' + cards + "</ul></section>\n" +
  "</main>\n" + FOOTER + "</body>\n</html>\n";
}

/* ---------- region hub ---------- */
function renderRegionHub(country, region) {
  var pageUrl = SITE + regionUrl(country, region);
  var meta = regionMeta(region);
  var intro = meta.intro || ("Surf schools, shops, places to stay and board repair across " + region + ".");
  var trail = [{ name: "Home", href: "/" }, { name: country, href: countryUrl(country) }, { name: region }];
  var place = placeNode({ id: pageUrl + "#place", name: region, region: region, country: country });

  var hubTowns = townsWithHub(country, region);
  var townSection = hubTowns.length
    ? '<section class="hub-cat" id="towns"><div class="hub-cat__head"><h2>Surf towns in ' + esc(region) + "</h2></div>" +
      '<ul class="grid">' + hubTowns.map(function (t, i) { return placeCard(t, townUrl(country, region, t), countTown(country, region, t), i); }).join("") + "</ul></section>"
    : "";

  var sectionCats = CATEGORIES.filter(function (cat) { return itemsInRegion(country, region, cat).length > 0; });
  var sections = sectionCats.map(function (cat) {
    var items = itemsInRegion(country, region, cat);
    return '<section class="hub-cat" id="' + cat.slug + '"><div class="hub-cat__head"><h2>' + esc(cat.title) + '</h2><a href="/' + cat.slug + '/">All ' + esc(cat.plural) + " &rarr;</a></div>" +
      '<ul class="grid">' + items.map(function (d) { return renderCard(d, cat, "h3"); }).join("") + "</ul></section>";
  }).join("\n");

  var jump = [];
  if (hubTowns.length) jump.push('<a href="#towns">Towns</a>');
  sectionCats.forEach(function (cat) { jump.push('<a href="#' + cat.slug + '">' + esc(cat.title) + "</a>"); });
  var jumpNav = jump.length > 1 ? '<nav class="jump-nav" aria-label="Jump to a section">' + jump.join("") + "</nav>" : "";

  return head({
    title: "Surf Schools, Shops & Stays in " + region + " | surflist",
    desc: intro + " Browse surf towns and businesses in " + region + " on surflist.",
    canonical: pageUrl,
    jsonld: collectionJsonLd({ pageUrl: pageUrl, name: "Surfing in " + region + " — surflist", place: place, trail: trail }),
  }) +
  "<body>\n" + header() +
  '<main class="wrap">' + crumbs(trail) +
  '<section class="hero"><h1>Surfing in ' + esc(region) + "</h1><p>" + esc(intro) + "</p>" + jumpNav + "</section>\n" +
  townSection + "\n" + sections + "\n</main>\n" + FOOTER +
  "</body>\n</html>\n";
}

/* ---------- town hub (the core asset) ---------- */
function editorialSlot(label, key) {
  return "\n<!-- EDITORIAL SLOT · " + label + " — add TOWN_CONTENT[\"" + key + "\"]." + label + " -->\n";
}
function renderTownHub(country, region, town) {
  var pageUrl = SITE + townUrl(country, region, town);
  var key = cSlug(country) + "/" + rSlug(region) + "/" + tSlug(town);
  var ed = townContent(country, region, town);
  var placeStr = [region, country].filter(Boolean).join(", ");
  var trail = [
    { name: "Home", href: "/" },
    { name: country, href: countryUrl(country) },
    { name: region, href: regionUrl(country, region) },
    { name: town },
  ];
  var place = placeNode({ id: pageUrl + "#place", name: town, town: town, region: region, country: country });

  var autoIntro = town + " is a surf spot in " + placeStr + ". Find surf schools, shops, places to stay and board repair in " + town + " below.";
  var intro = ed.intro || autoIntro;

  // category sections
  var sectionCats = CATEGORIES.filter(function (cat) { return itemsInTown(country, region, town, cat).length > 0; });
  var sections = sectionCats.map(function (cat) {
    var items = itemsInTown(country, region, town, cat);
    var viewAll = townCatPageExists(country, region, town, cat)
      ? '<a href="' + townCatUrl(country, region, town, cat) + '">All ' + esc(cat.plural) + " in " + esc(town) + " &rarr;</a>"
      : "";
    return '<section class="hub-cat" id="' + cat.slug + '"><div class="hub-cat__head"><h2>' + esc(cat.title) + "</h2>" + viewAll + "</div>" +
      '<ul class="grid">' + items.map(function (d) { return renderCard(d, cat, "h3"); }).join("") + "</ul></section>";
  }).join("\n");

  // editorial: beaches
  var beachesHtml, faqExtra = null;
  if (Array.isArray(ed.beaches) && ed.beaches.length) {
    beachesHtml = '<section class="town-ed" id="beaches"><h2>Best beaches in ' + esc(town) + "</h2><div class=\"ed-list\">" +
      ed.beaches.map(function (b) {
        return '<div class="ed-item"><h3>' + esc(b.name) + "</h3>" + (b.note ? "<p>" + esc(b.note) + "</p>" : "") + "</div>";
      }).join("") + "</div></section>";
  } else {
    beachesHtml = editorialSlot("beaches", key);
  }

  // editorial: when to surf
  var whenHtml;
  if (ed.whenToSurf) {
    whenHtml = '<section class="town-ed" id="when"><h2>When to surf ' + esc(town) + "</h2>" +
      String(ed.whenToSurf).split(/\n\n+/).map(function (p) { return "<p>" + esc(p.trim()) + "</p>"; }).join("") + "</section>";
  } else {
    whenHtml = editorialSlot("whenToSurf", key);
  }

  // editorial: FAQ (+ FAQPage schema)
  var faqHtml;
  if (Array.isArray(ed.faq) && ed.faq.length) {
    faqHtml = '<section class="town-ed" id="faq"><h2>Surfing in ' + esc(town) + " FAQ</h2><div class=\"faq\">" +
      ed.faq.map(function (f) {
        return '<details class="faq-item"><summary>' + esc(f.q) + "</summary><div><p>" + esc(f.a) + "</p></div></details>";
      }).join("") + "</div></section>";
    faqExtra = {
      "@type": "FAQPage",
      "@id": pageUrl + "#faq",
      mainEntity: ed.faq.map(function (f) {
        return { "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } };
      }),
    };
  } else {
    faqHtml = editorialSlot("faq", key);
  }

  // jump nav
  var jump = sectionCats.map(function (cat) { return '<a href="#' + cat.slug + '">' + esc(cat.title) + "</a>"; });
  if (Array.isArray(ed.beaches) && ed.beaches.length) jump.push('<a href="#beaches">Beaches</a>');
  if (ed.whenToSurf) jump.push('<a href="#when">When to surf</a>');
  if (Array.isArray(ed.faq) && ed.faq.length) jump.push('<a href="#faq">FAQ</a>');
  var jumpNav = jump.length > 1 ? '<nav class="jump-nav" aria-label="Jump to a section">' + jump.join("") + "</nav>" : "";

  return head({
    title: "Surf Schools, Shops & Stays in " + town + ", " + region + " | surflist",
    desc: (ed.intro ? ed.intro : ("Surf schools, shops, places to stay and board repair in " + town + ", " + placeStr + ".")).slice(0, 155),
    canonical: pageUrl,
    jsonld: collectionJsonLd({ pageUrl: pageUrl, name: "Surfing in " + town + " — surflist", place: place, trail: trail, extra: faqExtra }),
  }) +
  "<body>\n" + header() +
  '<main class="wrap">' + crumbs(trail) +
  '<section class="hero"><h1>Surfing in ' + esc(town) + "</h1><p>" + esc(intro) + "</p>" + jumpNav + "</section>\n" +
  sections + "\n" + beachesHtml + whenHtml + faqHtml + "\n</main>\n" + FOOTER +
  "</body>\n</html>\n";
}

/* ---------- town-category page ---------- */
function renderTownCategory(country, region, town, cat) {
  var pageUrl = SITE + townCatUrl(country, region, town, cat);
  var items = itemsInTown(country, region, town, cat);
  var n = items.length;
  var title = cat.title + " in " + town;
  var trail = [
    { name: "Home", href: "/" },
    { name: country, href: countryUrl(country) },
    { name: region, href: regionUrl(country, region) },
    { name: town, href: townUrl(country, region, town) },
    { name: cat.title },
  ];
  var place = placeNode({ id: pageUrl + "#place", name: town, town: town, region: region, country: country });

  return head({
    title: title + " — surflist",
    desc: cat.intro + " " + cat.title + " in " + town + ", " + region + " on surflist.",
    canonical: pageUrl,
    jsonld: collectionJsonLd({ pageUrl: pageUrl, name: title + " — surflist", place: place, trail: trail }),
  }) +
  "<body>\n" + header() +
  '<main class="wrap">' + crumbs(trail) +
  '<a class="back" href="' + townUrl(country, region, town) + '">&larr; Surfing in ' + esc(town) + "</a>\n" +
  '<div class="cat-head"><h1>' + esc(title) + "</h1><p>" + esc(cat.intro) + "</p></div>" +
  '<div class="layout">' + renderSidebar(cat, { items: items, scoped: true }) +
  '<div class="main"><p class="count" id="count" aria-live="polite" data-noun="' + esc(cat.singular) + '" data-nounp="' + esc(cat.plural) + '">' +
  n + " " + (n === 1 ? cat.singular : cat.plural) + "</p>" +
  '<ul class="grid" id="list">' + items.map(function (d) { return renderCard(d, cat, "h2"); }).join("") + "</ul></div></div>" +
  "</main>\n" + FOOTER + "<script>" + FILTER_JS + "</script>\n</body>\n</html>\n";
}

/* ---------- browse-all category page (/surf-schools/) ---------- */
function renderCategory(cat) {
  var items = cat.items;
  var n = items.length;
  var trail = [{ name: "Home", href: "/" }, { name: cat.title }];
  return head({
    title: cat.title + " — surflist",
    desc: cat.intro + " Filter by country and region on surflist.",
    canonical: SITE + "/" + cat.slug + "/",
    jsonld: JSON.stringify({ "@context": "https://schema.org", "@graph": [surflistEntity(), breadcrumbJsonLd(trail)] }, null, 2),
  }) +
  "<body>\n" + header() +
  '<main class="wrap">' + crumbs(trail) +
  '<div class="cat-head"><h1>' + esc(cat.title) + "</h1><p>" + esc(cat.intro) + "</p></div>" +
  '<div class="layout">' + renderSidebar(cat, { items: items }) +
  '<div class="main"><p class="count" id="count" aria-live="polite" data-noun="' + esc(cat.singular) + '" data-nounp="' + esc(cat.plural) + '">' +
  n + " " + (n === 1 ? cat.singular : cat.plural) + "</p>" +
  '<ul class="grid" id="list">' + items.map(function (d) { return renderCard(d, cat, "h2"); }).join("") + "</ul></div></div></main>\n" +
  FOOTER + "<script>" + FILTER_JS + "</script>\n</body>\n</html>\n";
}

/* ---------- listing detail (flat, canonical) ---------- */
function jsonLd(d, cat, pageUrl, trail, extra) {
  var address = { "@type": "PostalAddress" };
  if (d.streetAddress) address.streetAddress = d.streetAddress;
  if (d.town) address.addressLocality = d.town;
  if (d.region) address.addressRegion = d.region;
  var cc = shared.countryCode(d.country); if (cc) address.addressCountry = cc;
  var hasAddress = !!(d.streetAddress || d.town || d.region || cc);

  var biz = { "@type": cat.schemaType(d), "@id": pageUrl + "#business", name: d.name };
  if (hasAddress) biz.address = address;
  if (d.description || d.blurb) biz.description = d.description || d.blurb;
  if (d.url) biz.url = d.url;
  if (d.image) biz.image = d.image;
  if (typeof d.lat === "number" && typeof d.lng === "number") biz.geo = { "@type": "GeoCoordinates", latitude: d.lat, longitude: d.lng };
  if (d.priceRange) biz.priceRange = d.priceRange;
  if (d.phone) biz.telephone = Array.isArray(d.phone) ? d.phone.filter(Boolean) : d.phone;
  if (d.email) biz.email = d.email;
  var hours = visibleHours(d.openingHours);
  if (hours) biz.openingHours = hours;
  if (d.bookingUrl) biz.potentialAction = { "@type": "ReserveAction", target: d.bookingUrl };
  if (Array.isArray(d.surfSpots) && d.surfSpots.length) {
    biz.areaServed = d.surfSpots.map(function (s) { return { "@type": "Place", name: s }; });
  }
  var sameAs = SOCIAL_ORDER.map(function (k) { return d.socials && d.socials[k]; }).filter(Boolean);
  if (d.googleBusiness) sameAs.push(d.googleBusiness);
  if (sameAs.length) biz.sameAs = sameAs;

  var placeBit = [d.town, d.region].filter(Boolean).join(", ");
  var page = {
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: d.name + " — " + cat.singular + (placeBit ? " in " + placeBit : "") + " on surflist",
    isPartOf: { "@id": SITE + "/#website" },
    about: { "@id": pageUrl + "#business" },
    mainEntity: { "@id": pageUrl + "#business" },
  };
  if (isVerified(d)) page.reviewedBy = { "@id": SITE + "/#organization" };
  if (d.lastVerified) page.lastReviewed = d.lastVerified;
  if (d.lastChecked) page.dateModified = d.lastChecked;
  var graph = [surflistEntity(), biz, page, breadcrumbJsonLd(trail)];
  if (extra) graph.push(extra);
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
}
function faqBlock(faq, title, pageUrl) {
  if (!Array.isArray(faq) || !faq.length) return { html: "", jsonld: null };
  var html = '<section class="detail__section" id="faq"><h2>' + esc(title) + '</h2><div class="faq">' +
    faq.map(function (f) {
      return '<details class="faq-item"><summary>' + esc(f.q) + "</summary><div><p>" + esc(f.a) + "</p></div></details>";
    }).join("") + "</div></section>";
  var jsonld = {
    "@type": "FAQPage",
    "@id": pageUrl + "#faq",
    mainEntity: faq.map(function (f) {
      return { "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } };
    }),
  };
  return { html: html, jsonld: jsonld };
}
function fmtDate(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
  if (!m) return esc(s || "");
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return parseInt(m[3], 10) + " " + months[parseInt(m[2], 10) - 1] + " " + m[1];
}
function chips(arr) {
  return (Array.isArray(arr) && arr.length)
    ? '<div class="tags">' + arr.map(function (v) { return '<span class="lvl">' + esc(v) + "</span>"; }).join("") + "</div>"
    : "";
}
function asList(val) {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (val) return [val];
  return [];
}
/* Drop scrape-dump strings so they never reach visible HTML or Hours/JSON-LD. */
function isScrapeNote(s) {
  var t = String(s || "").trim();
  if (!t) return true;
  if (/^GBP\.?$/i.test(t)) return true;
  if (/JSON-?LD/i.test(t)) return true;
  if (/\bschema\b/i.test(t)) return true;
  if (/Site conflicts/i.test(t)) return true;
  if (/Activity-prices page:/i.test(t)) return true;
  if (/\bFAQ:/i.test(t)) return true;
  if (/dateModified/i.test(t)) return true;
  if (/do not reconcile/i.test(t)) return true;
  return false;
}
function visibleList(val) {
  return asList(val).filter(function (v) { return !isScrapeNote(v); });
}
function visibleHours(val) {
  var hours = visibleList(val);
  if (!hours.length) return "";
  if (!Array.isArray(val) && hours.length === 1) return hours[0];
  return hours;
}
function bulletList(arr) {
  arr = visibleList(arr);
  return arr.length
    ? '<ul class="spec-list">' + arr.map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("") + "</ul>"
    : "";
}
function listOrText(val) {
  if (Array.isArray(val)) return bulletList(val);
  if (val && isScrapeNote(val)) return "";
  if (val) return "<p>" + esc(val) + "</p>";
  return "";
}
function hoursText(val) {
  val = visibleHours(val);
  if (Array.isArray(val)) return val.filter(Boolean).join("; ");
  return val ? String(val) : "";
}
function phoneHtml(val) {
  var nums = Array.isArray(val) ? val.filter(Boolean) : (val ? [val] : []);
  return nums.map(function (n) {
    return '<a href="tel:' + esc(String(n).replace(/\s+/g, "")) + '">' + esc(n) + "</a>";
  }).join("<br>");
}
function detailSection(title, inner) {
  return inner ? '<section class="detail__section"><h2>' + esc(title) + "</h2>" + inner + "</section>" : "";
}
function renderDetail(d, cat, slug, opts) {
  opts = opts || {};
  var verified = isVerified(d);
  var pageUrl = SITE + "/" + (opts.demo ? "verified-demo" : cat.slug + "/" + slug) + "/";
  var place = [d.town, d.region, d.country].filter(Boolean).join(", ");
  var placeShort = [d.town, d.region].filter(Boolean).join(", ");
  var img = d.image ? esc(d.image) : placeholderImage(d.name, cat.slug);
  var vals = facetVals(d, cat);
  var lead = verified
    ? d.name + " is a Surflist-verified " + cat.singular + " in " + place + "."
    : d.name + " is a " + cat.singular + " in " + place + ".";
  var descText = d.description || d.blurb || "";
  var metaDesc = (descText || lead).slice(0, 155);

  var facts = "";
  function fact(dt, dd) { return "<div><dt>" + dt + "</dt><dd>" + dd + "</dd></div>"; }
  var addrLine = [d.streetAddress, d.town, d.region].filter(Boolean).join(", ");
  if (addrLine) facts += fact("Location", esc(addrLine));
  if (d.country) facts += fact("Country", esc(d.country));
  if (hoursText(d.openingHours)) facts += fact("Hours", esc(hoursText(d.openingHours)));
  if (d.priceRange) facts += fact("Pricing range", esc(d.priceRange));
  if (d.groupSize) facts += fact("Group size", esc(d.groupSize));
  if (d.minAge) facts += fact("Min age", esc(d.minAge));
  if (d.equipment) facts += fact("Equipment", esc(d.equipment));
  if (vals.length) facts += fact(esc(cat.facetLabel), esc(vals.join(", ")));
  if (typeof d.lat === "number" && typeof d.lng === "number") facts += fact("Coordinates", d.lat.toFixed(4) + ", " + d.lng.toFixed(4));
  if (d.phone) facts += fact("Phone", phoneHtml(d.phone));
  if (d.email) facts += fact("Email", '<a href="mailto:' + esc(d.email) + '">' + esc(d.email) + "</a>");
  if (d.lastVerified) facts += fact("Last verified", fmtDate(d.lastVerified));
  if (d.lastChecked) facts += fact("Last checked", fmtDate(d.lastChecked));

  var cta = "";
  if (d.bookingUrl) cta += '<a class="btn" href="' + esc(d.bookingUrl) + '" target="_blank" rel="noopener nofollow">Book now &rarr;</a>';
  if (d.url) cta += '<a class="btn' + (d.bookingUrl ? " btn--secondary" : "") + '" href="' + esc(d.url) + '" target="_blank" rel="noopener nofollow">Visit website &rarr;</a>';
  var links = socialsHtml(d.socials, d.googleBusiness);

  var faq = faqBlock(d.faq, "FAQs", pageUrl);
  var priceList = bulletList(d.pricing);
  var pricesInner = priceList
    || (cat.slug === "surf-schools" ? "<p>Contact " + esc(d.name) + " to confirm.</p>" : "");
  var sections =
    detailSection("Services", bulletList(d.services)) +
    detailSection("Lessons", bulletList(d.lessons)) +
    detailSection("Rentals", bulletList(d.rentals)) +
    detailSection("Camps", bulletList(d.camps)) +
    detailSection("Prices", pricesInner) +
    detailSection("Surf spots served", chips(d.surfSpots) + bulletList(d.spotNotes)) +
    detailSection("Surf conditions", listOrText(d.surfConditions)) +
    detailSection("Logistics & amenities", bulletList(d.amenities)) +
    detailSection("Accreditation", chips(d.accreditations)) +
    (d.seasonal ? detailSection("When to go", "<p>" + esc(d.seasonal) + "</p>") : "") +
    faq.html;

  var badge = verified
    ? '<span class="badge-verified inline"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.55 17.6 4.4 12.45l1.4-1.4 3.75 3.75 8-8 1.4 1.4z"/></svg>Surflist verified</span>'
    : "";
  var verifiedMeta = verified
    ? '<p class="verified-meta">Verified by surflist' +
      (d.lastVerified ? " &middot; last verified " + fmtDate(d.lastVerified) : "") + "</p>"
    : "";
  var closedNote = d.appearsActive === false
    ? '<p class="detail__note">This listing may currently be closed.</p>'
    : "";
  var demoBanner = opts.demo
    ? '<div class="demo-banner"><strong>Example listing.</strong> This is a demo of a Surflist verified profile, not a real business. Run a surf business? <a href="/list-your-business/">Claim your verified listing &rarr;</a></div>'
    : "";
  // link "back" to the business's town hub when it exists, else its category page
  var hasTownHub = !opts.demo && townHubExists(d.country, d.region, d.town);
  var backHref = hasTownHub ? townUrl(d.country, d.region, d.town) : "/" + cat.slug + "/";
  var backText = hasTownHub ? "Surfing in " + d.town : "All " + cat.plural;

  var trail = [{ name: "Home", href: "/" }];
  if (hasTownHub) {
    trail.push({ name: d.country, href: countryUrl(d.country) });
    trail.push({ name: d.region, href: regionUrl(d.country, d.region) });
    trail.push({ name: d.town, href: townUrl(d.country, d.region, d.town) });
  } else {
    trail.push({ name: cat.title, href: "/" + cat.slug + "/" });
  }
  trail.push({ name: d.name });

  return head({
    title: d.name + " — " + cat.singular + " in " + (placeShort || place) + " | surflist",
    desc: metaDesc, canonical: pageUrl, ogImage: d.image || "", jsonld: jsonLd(d, cat, pageUrl, trail, faq.jsonld),
    noindex: !!opts.demo,
  }) +
  "<body>\n" + header() +
  '<main class="wrap detail">' + demoBanner +
  (opts.demo ? "" : crumbs(trail) + '\n<a class="back" href="' + backHref + '">&larr; ' + esc(backText) + "</a>\n") +
  '  <div class="detail__head"><p class="detail__eyebrow">' + esc(place) + '</p><h1 class="detail__title">' + esc(d.name) + "</h1>" +
  badge + verifiedMeta + "</div>\n" +
  '  <div class="detail__media"><img src="' + img + '" alt="' + esc(d.name) + '" /></div>\n' +
  '  <div class="detail__grid"><div class="detail__body"><p class="detail__lead">' + esc(lead) + "</p>" + closedNote +
  (descText ? '<div class="detail__prose">' + String(descText).split(/\n\n+/).map(function (p) { return "<p>" + esc(p.trim()) + "</p>"; }).join("") + "</div>" : "") +
  sections + "</div>\n" +
  '    <aside class="detail__facts"><h2>Details</h2><dl class="facts">' + facts + "</dl>" + cta + links + "</aside>\n" +
  "  </div></main>\n" + FOOTER + "</body>\n</html>\n";
}

/* ---------- search (businesses + destinations) ---------- */
function searchIndex() {
  var idx = [];
  // destinations first so a place match ranks visibly
  countries().forEach(function (c) {
    idx.push({ n: c, p: "Country", c: "destination", u: countryUrl(c), v: true });
    regionsIn(c).forEach(function (r) {
      idx.push({ n: r, p: c, c: "destination", u: regionUrl(c, r), v: true });
      townsWithHub(c, r).forEach(function (t) {
        idx.push({ n: t, p: [r, c].join(", "), c: "destination", u: townUrl(c, r, t), v: true });
      });
    });
  });
  // businesses
  CATEGORIES.forEach(function (cat) {
    cat.items.forEach(function (d) {
      var href = listingHref(d, cat);
      if (!href) return;
      var facetVal = d[cat.facetField];
      var f = Array.isArray(facetVal) ? facetVal.join(" ") : (facetVal || "");
      idx.push({ n: d.name, p: [d.town, d.region, d.country].filter(Boolean).join(", "), c: cat.singular, f: f, u: href, v: isVerified(d) });
    });
  });
  return idx;
}
function latestPool() {
  var out = [];
  CATEGORIES.forEach(function (cat) {
    cat.items.forEach(function (d) {
      var verified = isVerified(d);
      var href = listingHref(d, cat);
      if (!href) return;
      out.push({
        n: d.name,
        p: [d.town, d.region].filter(Boolean).join(", "),
        cat: cat.singular,
        u: href,
        v: verified,
        img: d.image ? d.image : placeholderImage(d.name, cat.slug),
        b: (verified || cat.slug === "surf-schools") && d.blurb ? d.blurb : "",
      });
    });
  });
  return out;
}
function renderSearch() {
  return '<div class="search" role="search">' +
    '<input type="text" id="search-input" class="search__input" placeholder="Search a destination, town or surf business&hellip;" ' +
    'autocomplete="off" spellcheck="false" aria-label="Search destinations and listings" role="combobox" aria-expanded="false" ' +
    'aria-controls="search-results" aria-autocomplete="list" />' +
    '<ul id="search-results" class="search__results" role="listbox" hidden></ul>' +
    '<script type="application/json" id="search-data">' + JSON.stringify(searchIndex()).replace(/</g, "\\u003c") + "</script>" +
    "</div>";
}
const SEARCH_JS =
"(function(){var input=document.getElementById('search-input');if(!input)return;var box=document.getElementById('search-results');" +
"var items=JSON.parse(document.getElementById('search-data').textContent);var active=-1;" +
"function esc(s){return String(s).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}" +
"function highlight(opts){opts.forEach(function(o,i){o.classList.toggle('is-active',i===active);});input.setAttribute('aria-activedescendant',active>-1?opts[active].parentElement.id:'');}" +
"function render(list){box.innerHTML='';active=-1;" +
"if(!list.length){box.hidden=true;input.setAttribute('aria-expanded','false');return;}" +
"list.forEach(function(d,i){var li=document.createElement('li');li.setAttribute('role','option');li.id='search-opt-'+i;" +
"var a=document.createElement('a');a.href=d.u;a.className='search__result';if(d.u.charAt(0)!=='/'){a.target='_blank';a.rel='noopener';}" +
"a.innerHTML='<span class=\"search__name\">'+esc(d.n)+'</span><span class=\"search__meta\">'+esc(d.c)+(d.p?' &middot; '+esc(d.p):'')+'</span>';" +
"li.appendChild(a);box.appendChild(li);});" +
"box.hidden=false;input.setAttribute('aria-expanded','true');}" +
"function search(q){q=q.trim().toLowerCase();if(!q)return [];" +
"var r=items.filter(function(d){return (d.n+' '+d.p+' '+d.c+' '+(d.f||'')).toLowerCase().indexOf(q)>-1;});" +
"r.sort(function(a,b){var ad=a.c==='destination'?0:1,bd=b.c==='destination'?0:1;return ad-bd;});return r.slice(0,8);}" +
"input.addEventListener('input',function(){render(search(input.value));});" +
"input.addEventListener('keydown',function(e){var opts=box.querySelectorAll('.search__result');if(!opts.length)return;" +
"if(e.key==='ArrowDown'){e.preventDefault();active=Math.min(active+1,opts.length-1);highlight(opts);}" +
"else if(e.key==='ArrowUp'){e.preventDefault();active=Math.max(active-1,-1);highlight(opts);}" +
"else if(e.key==='Enter'){if(active>-1){e.preventDefault();opts[active].click();}}" +
"else if(e.key==='Escape'){box.hidden=true;input.setAttribute('aria-expanded','false');}});" +
"document.addEventListener('click',function(e){if(!e.target.closest('.search'))box.hidden=true;});})();";

/* ---------- homepage ---------- */
function renderDestinations() {
  var chips = countries().slice().sort(function (a, b) { return a.localeCompare(b); }).map(function (c) {
    return '<a class="dest-country" href="' + countryUrl(c) + '">' + flagHtml(c) + "<span>" + esc(c) + "</span></a>";
  }).join("");
  return '<section class="hub-cat" id="destinations"><div class="hub-cat__head"><h2>Explore destinations</h2></div>' +
    '<nav class="dest-chips" aria-label="Explore destinations">' + chips + "</nav></section>\n";
}
function renderPopularTowns() {
  var towns = [];
  countries().forEach(function (c) {
    regionsIn(c).forEach(function (r) {
      townsWithHub(c, r).forEach(function (t) {
        towns.push({ name: t, href: townUrl(c, r, t), count: countTown(c, r, t) });
      });
    });
  });
  towns.sort(function (a, b) { return b.count - a.count || a.name.localeCompare(b.name); });
  towns = towns.slice(0, 8);
  if (!towns.length) return "";
  return '<section class="hub-cat" id="popular"><div class="hub-cat__head"><h2>Popular surf destinations</h2></div>' +
    '<nav class="chip-nav" aria-label="Popular destinations">' +
    towns.map(function (t) { return '<a href="' + t.href + '">' + esc(t.name) + "</a>"; }).join("") +
    "</nav></section>\n";
}
function renderLatestListings() {
  var pool = latestPool();
  if (!pool.length) return "";
  return '<section class="hub-cat" id="latest"><div class="hub-cat__head"><h2>Latest listings</h2></div>' +
    '<ul class="grid" id="latest-listings"></ul>' +
    '<script type="application/json" id="latest-data">' + JSON.stringify(pool).replace(/</g, "\\u003c") + "</script>" +
    "</section>\n";
}
const LATEST_JS =
"(function(){var ul=document.getElementById('latest-listings');if(!ul)return;" +
"var pool=JSON.parse(document.getElementById('latest-data').textContent);" +
"for(var i=pool.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=pool[i];pool[i]=pool[j];pool[j]=t;}" +
"function esc(s){return String(s).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}" +
"function card(d){var badge=d.v?'<span class=\"badge-verified\"><svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M9.55 17.6 4.4 12.45l1.4-1.4 3.75 3.75 8-8 1.4 1.4z\"/></svg>Surflist verified</span>':'';" +
"var onsite=d.u.charAt(0)==='/';var attrs=onsite?'':' target=\"_blank\" rel=\"noopener\"';var text=onsite?'View':'Visit';" +
"var name=onsite?'<a class=\"card__name-link\" href=\"'+esc(d.u)+'\">'+esc(d.n)+'</a>':esc(d.n);" +
"return '<li class=\"card'+(d.v?' is-verified':'')+'\"><div class=\"card__media\">'+" +
"(onsite?'<a href=\"'+esc(d.u)+'\" aria-label=\"'+esc(d.n)+'\">':'')+'<img src=\"'+esc(d.img)+'\" alt=\"'+esc(d.n)+'\" loading=\"lazy\">'+(onsite?'</a>':'')+badge+'</div>'+" +
"'<div class=\"card__body\"><span class=\"card__place\">'+esc(d.p)+' &middot; '+esc(d.cat)+'</span><h3 class=\"card__name\">'+name+'</h3>'+" +
"(d.b?'<p class=\"card__blurb\">'+esc(d.b)+'</p>':'')+" +
"'<div class=\"card__foot\"><a class=\"visit\" href=\"'+esc(d.u)+'\"'+attrs+'>'+text+' &rarr;</a></div></div></li>';}" +
"ul.innerHTML=pool.slice(0,8).map(card).join('');})();";
function renderHub() {
  return head({
    title: "Surf Directory — Find Surf Schools, Shops & Stays | surflist",
    desc: "Find everything you need for your next surf trip: surf schools, shops, places to stay and board repair, by destination.",
    canonical: SITE + "/",
  }) +
  "<body>\n" + header() +
  '<main class="wrap"><section class="hero"><h1>Where surfers and surf businesses meet.</h1>' +
  "<p>Find surf schools, shops, stays and board repair by destination.</p>" +
  renderSearch() + "</section>\n" +
  renderDestinations() +
  renderPopularTowns() +
  renderLatestListings() +
  "</main>\n" + FOOTER + "<script>" + SEARCH_JS + LATEST_JS + "</script>\n</body>\n</html>\n";
}
function renderListYourBusiness() {
  var pageUrl = SITE + "/list-your-business/";
  return head({
    title: "Get listed on Surflist",
    desc: "Ask to be listed on Surflist. We check every business against its own official website.",
    canonical: pageUrl,
  }) +
  "<body>\n" + header() +
  '<main class="wrap"><section class="hero hero--copy"><h1>Get listed on Surflist</h1>' +
  "<p>Surflist is a curated directory of surf schools, shops, stays and services.</p>" +
  "<p>We check every business against its own official website.</p>" +
  "<p>Send your details and we'll follow up about adding you.</p></section>\n" +
  '<section class="hub-cat"><div class="hub-cat__head"><h2>Tell us about your business</h2></div>' +
  '<form id="list-your-business-form" class="form-field">' +
  '<div class="form-row"><label for="lyb-business-name">Business name</label><input id="lyb-business-name" name="business_name" maxlength="140" required></div>' +
  '<div class="form-row"><label for="lyb-website">Website</label><input id="lyb-website" name="website" type="url" maxlength="500" required placeholder="https://www.yourbusiness.com"></div>' +
  '<div class="form-row"><label for="lyb-socials">Socials</label><textarea id="lyb-socials" name="socials" maxlength="1000" placeholder="Instagram, Facebook, TikTok — one per line"></textarea>' +
  '<p class="form-hint">Optional, but the more we can find you, the better your listing.</p></div>' +
  '<div class="form-row"><label for="lyb-contact-email">Contact email</label><input id="lyb-contact-email" name="contact_email" type="email" required></div>' +
  '<div class="form-actions"><button type="submit" class="btn">Send details</button></div>' +
  '<p class="form-error" id="list-your-business-error" hidden></p>' +
  "</form>" +
  '<div class="form-success" hidden></div>' +
  "</section>\n" +
  "</main>\n" + FOOTER + '<script src="/list-your-business.js" defer></script>\n</body>\n</html>\n';
}

/* ---------- about (entity home: full Organization + founder Person) ---------- */
function renderAbout() {
  var pageUrl = SITE + "/about/";
  var trail = [{ name: "Home", href: "/" }, { name: "About" }];
  var org = {
    "@type": "Organization",
    "@id": SITE + "/#organization",
    name: "Surflist",
    url: SITE,
    description: "Surflist is a curated directory of surf schools, shops, stays and services, organised by country, region and town.",
    foundingDate: "2026",
    founder: { "@id": SITE + "/#founder" },
    knowsAbout: ["Surfing", "Surf schools", "Surf shops", "Surf camps", "Surf travel"],
    sameAs: [],
  };
  var founder = {
    "@type": "Person",
    "@id": SITE + "/#founder",
    name: "Ben Manton",
    worksFor: { "@id": SITE + "/#organization" },
    sameAs: [],
  };
  return head({
    title: "About Surflist",
    desc: "Surflist is a curated directory of surf schools, shops, stays and services, organised by country, region and town.",
    canonical: pageUrl,
    jsonld: JSON.stringify({ "@context": "https://schema.org", "@graph": [org, founder, breadcrumbJsonLd(trail)] }, null, 2),
  }) +
  "<body>\n" + header() +
  '<main class="wrap">' + crumbs(trail) +
  '<section class="hero hero--copy"><h1>About Surflist</h1>' +
  "<p>Surflist is a curated directory of surf schools, shops, stays and services, organised by country, region and town.</p>" +
  "<p>Every listing is checked against the business's own official website.</p>" +
  "<p>If we can't confirm a business is real and operating from its own site, it isn't listed.</p>" +
  "<p>Founded in 2026 by Ben Manton.</p>" +
  '<p>If you run a surf business, <a href="/list-your-business/">get listed</a>.</p></section>\n' +
  "</main>\n" + FOOTER + "</body>\n</html>\n";
}

function renderNotFound() {
  return head({
    title: "Page not found | surflist",
    desc: "That page isn't on Surflist.",
    canonical: SITE + "/",
    noindex: true,
  }) +
  "<body>\n" + header() +
  '<main class="wrap"><section class="hero hero--copy"><h1>Page not found</h1>' +
  "<p>That page isn't on Surflist.</p>" +
  '<a class="btn" href="/">Back to the directory</a></section>\n' +
  "</main>\n" + FOOTER + "</body>\n</html>\n";
}

/* ---------- robots.txt ---------- */
const SEARCH_CRAWLERS = ["Googlebot", "Bingbot", "Applebot", "DuckDuckBot"];
const AI_CRAWLERS = [
  "GPTBot", "ChatGPT-User", "OAI-SearchBot",
  "ClaudeBot", "Claude-User", "Claude-SearchBot",
  "Google-Extended", "PerplexityBot", "Perplexity-User",
  "Meta-ExternalAgent", "Applebot-Extended", "Amazonbot", "CCBot", "Bytespider",
];
function renderRobots() {
  function block(ua) { return "User-agent: " + ua + "\nAllow: /\nDisallow: /verified-demo/\n"; }
  return "# Search engines\n" + SEARCH_CRAWLERS.map(block).join("\n") +
    "\n# AI assistants & answer engines\n" + AI_CRAWLERS.map(block).join("\n") +
    "\n# Everyone else\n" + block("*") +
    "\nSitemap: " + SITE + "/sitemap.xml\n";
}

/* ---------- llms.txt ---------- */
function renderLlms() {
  var out = ["# surflist", "",
    "> surflist is a directory for surf trips, organised by destination. Each surf town has a hub page (\"Surfing in <town>\") linking to its surf schools, surf shops, places to stay (camps, hostels, eco-pods, campervans) and surf services like board repair. Browse from country to region to town, or by category.",
    "", "## Destinations", ""];
  countries().forEach(function (c) {
    out.push("- [Surfing in " + c + "](" + SITE + countryUrl(c) + "): " + countCountry(c) + " listings across " + regionsIn(c).join(", ") + ".");
    regionsIn(c).forEach(function (r) {
      out.push("  - [Surfing in " + r + "](" + SITE + regionUrl(c, r) + "): " + countRegion(c, r) + " listings.");
      townsWithHub(c, r).forEach(function (t) {
        out.push("    - [Surfing in " + t + "](" + SITE + townUrl(c, r, t) + "): " + countTown(c, r, t) + " listings.");
      });
    });
  });
  out.push("");
  out.push("## Browse by type");
  out.push("");
  CATEGORIES.forEach(function (c) { out.push("- [" + c.title + "](" + SITE + "/" + c.slug + "/): " + c.intro); });
  out.push("");
  CATEGORIES.forEach(function (cat) {
    if (cat.slug === "surf-schools") {
      if (!cat.items.length) return;
      out.push("## Surf schools");
      out.push("");
      cat.items.forEach(function (d) {
        var place = [d.town, d.region, d.country].filter(Boolean).join(", ");
        var desc = String(d.blurb || "").replace(/\s+/g, " ").trim().replace(/\.+$/, "");
        out.push("- [" + d.name + "](" + SITE + "/" + cat.slug + "/" + slugOf(d) + "/): " + cat.singular + " in " + place + (desc ? " — " + desc : "") + ".");
      });
      out.push("");
      return;
    }
    var verified = cat.items.filter(isVerified);
    if (!verified.length) return;
    out.push("## Verified " + cat.plural);
    out.push("");
    verified.forEach(function (d) {
      var place = [d.town, d.region, d.country].filter(Boolean).join(", ");
      var desc = String(d.blurb || "").replace(/\s+/g, " ").trim().replace(/\.+$/, "");
      out.push("- [" + d.name + "](" + SITE + "/" + cat.slug + "/" + slugOf(d) + "/): " + cat.singular + " in " + place + (desc ? " — " + desc : "") + ".");
    });
    out.push("");
  });
  out.push("## About");
  out.push("");
  out.push("Surflist is a curated directory of surf schools, shops, stays and services, organised by country, region and town. Every listing is checked against the business's own official website. To get listed, see " + SITE + "/list-your-business/ or email listings@surflist.co. Read more at " + SITE + "/about/.");
  out.push("");
  return out.join("\n");
}

/* ---------- place integrity report ----------
   Locations are derived from the data (a place exists because a listing names
   it), so a typo silently forks a new town/region. This report catches that.

     node build.js --check     print the whole place tree with counts, flag
                               towns below the 2-listing hub threshold, and fail
                               (exit 1) on any spelling that forks one place into
                               two slugs, or on listing-slug collisions that
                               survive town-suffix disambiguation — without
                               writing any files.

   Every normal build also prints a passive warning for such collisions. */
function q(s) { return '"' + s + '"'; }
function slugForks(names, slugFn) {
  // group raw names by their slug; return [{slug, names:[...]}] where >1 distinct raw name shares a slug
  var by = {};
  names.forEach(function (n) { (by[slugFn(n)] = by[slugFn(n)] || []).push(n); });
  return Object.keys(by).map(function (s) { return { slug: s, names: uniqSorted(by[s]) }; })
    .filter(function (g) { return g.names.length > 1; });
}
function placeReport() {
  var lines = ["", "Place tree — " + countries().length + " countr" + (countries().length === 1 ? "y" : "ies") +
    ", " + ALL.length + " listings:"];
  var collisions = [], singletons = [];

  slugForks(countries(), cSlug).forEach(function (g) {
    collisions.push('country slug "' + g.slug + '" is fed by ' + g.names.map(q).join(" and "));
  });
  countries().forEach(function (c) {
    lines.push("  " + c + "  (" + countCountry(c) + ")");
    slugForks(regionsIn(c), rSlug).forEach(function (g) {
      collisions.push('region slug "' + g.slug + '" in ' + c + ' is fed by ' + g.names.map(q).join(" and "));
    });
    regionsIn(c).forEach(function (r) {
      lines.push("    " + r + "  (" + countRegion(c, r) + ")");
      slugForks(townsIn(c, r), tSlug).forEach(function (g) {
        collisions.push('town slug "' + g.slug + '" in ' + r + ", " + c + ' is fed by ' + g.names.map(q).join(" and "));
      });
      townsIn(c, r).forEach(function (t) {
        var n = countTown(c, r, t);
        if (n < 2) singletons.push(t + " (" + r + ", " + c + ")");
        lines.push("      " + t + "  (" + n + ")" + (n < 2 ? "   <- 1 listing, below hub threshold" : ""));
      });
    });
  });

  var out = [lines.join("\n"), ""];
  out.push(singletons.length
    ? "Towns below the hub threshold (need >=2 for their own page): " + singletons.length +
      " — " + singletons.join("; ")
    : "Every town has >=2 listings (all get a hub).");
  out.push(collisions.length
    ? "\n! " + collisions.length + " duplicate place(s) from inconsistent spelling:\n  - " + collisions.join("\n  - ") +
      "\n  Fix the spelling in data/*.js so each place resolves to one slug."
    : "No duplicate-spelling collisions.");
  if (listingSlugDisambiguations.length) {
    out.push("Listing slugs disambiguated with town: " + listingSlugDisambiguations.length +
      " — " + listingSlugDisambiguations.join("; ") + ".");
  }
  out.push(listingSlugCollisions.length
    ? "\n! " + listingSlugCollisions.length + " listing slug collision(s) after town-suffix disambiguation:\n  - " +
      listingSlugCollisions.join("\n  - ") +
      "\n  Two listings would write the same path. Give one an explicit slug, or rename so they differ."
    : "No listing-slug collisions.");
  return { report: out.join("\n"), collisions: collisions, singletons: singletons };
}
(function () {
  var r = placeReport();
  // passive warning on every build
  r.collisions.forEach(function (c) { console.warn("  ! " + c); });
  listingSlugCollisions.forEach(function (c) { console.warn("  ! " + c); });
  // --check: print the full report and stop before writing anything
  if (process.argv.indexOf("--check") > -1) {
    process.stdout.write(r.report + "\n");
    process.exit((r.collisions.length || listingSlugCollisions.length) ? 1 : 0);
  }
  if (listingSlugCollisions.length) {
    throw new Error("Listing slug collisions:\n  - " + listingSlugCollisions.join("\n  - "));
  }
})();

/* ---------- write everything ---------- */
function writePage(rel, html) {
  var dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}
// remove previously generated top-level dirs so a restructure leaves nothing stale
uniqSorted(
  CATEGORIES.map(function (c) { return c.slug; })
    .concat(countries().map(function (c) { return cSlug(c); }))
    // legacy: old builds put regions at the root and used /schools/
    // "marketplace": removed feature — kept only to clean up a stale directory from an old build
    .concat(["cornwall", "devon", "swansea", "schools", "verified-demo", "marketplace"])
).forEach(function (s) { fs.rmSync(path.join(ROOT, s), { recursive: true, force: true }); });
// Cloudflare Pages: trailing-slash sitemap/robots otherwise 200 the homepage.
// Do not add a /* /index.html 200 SPA fallback — that is the missing-path bug.
fs.writeFileSync(path.join(ROOT, "_redirects"),
  "/sitemap.xml/ /sitemap.xml 301\n" +
  "/robots.txt/ /robots.txt 301\n");

var urls = [SITE + "/"];
fs.writeFileSync(path.join(ROOT, "index.html"), renderHub());

writePage("list-your-business", renderListYourBusiness());
urls.push(SITE + "/list-your-business/");

writePage("about", renderAbout());
urls.push(SITE + "/about/");

// browse-all category pages + listing pages (schools: every listing; other cats: verified only)
var listingPages = 0;
CATEGORIES.forEach(function (cat) {
  writePage(cat.slug, renderCategory(cat));
  urls.push(SITE + "/" + cat.slug + "/");
  cat.items.forEach(function (d) {
    if (!hasListingPage(d, cat)) return;
    var slug = slugOf(d);
    writePage(cat.slug + "/" + slug, renderDetail(d, cat, slug));
    urls.push(SITE + "/" + cat.slug + "/" + slug + "/");
    listingPages++;
  });
});

// geographic tree: country -> region -> town -> town-category
var stats = { countries: 0, regions: 0, towns: 0, townCats: 0 };
countries().forEach(function (c) {
  writePage(cSlug(c), renderCountryHub(c));
  urls.push(SITE + countryUrl(c)); stats.countries++;
  regionsIn(c).forEach(function (r) {
    writePage(cSlug(c) + "/" + rSlug(r), renderRegionHub(c, r));
    urls.push(SITE + regionUrl(c, r)); stats.regions++;
    townsIn(c, r).forEach(function (t) {
      if (!townHubExists(c, r, t)) return; // thin-content guard
      writePage(cSlug(c) + "/" + rSlug(r) + "/" + tSlug(t), renderTownHub(c, r, t));
      urls.push(SITE + townUrl(c, r, t)); stats.towns++;
      CATEGORIES.forEach(function (cat) {
        if (!townCatPageExists(c, r, t, cat)) return; // thin-content guard
        writePage(cSlug(c) + "/" + rSlug(r) + "/" + tSlug(t) + "/" + cat.slug, renderTownCategory(c, r, t, cat));
        urls.push(SITE + townCatUrl(c, r, t, cat)); stats.townCats++;
      });
    });
  });
});

/* ---------- verified profile demo (noindex sales sample) ---------- */
var DEMO_LISTING = {
  name: "Blue Horizon Surf Co",
  country: "England", region: "Cornwall", town: "Sennen Cove",
  url: "https://example.com",
  blurb: "A friendly, all-abilities surf school on Cornwall's far-west coast. (Sample listing.)",
  image: "", verified: true,
  socials: { instagram: "https://www.instagram.com/", facebook: "https://www.facebook.com/" },
  googleBusiness: "https://www.google.com/maps",
  levels: ["Beginner", "Intermediate", "Advanced", "Kids"],
  description: "Blue Horizon is a sample profile showing what a Surflist verified listing looks like: a fuller description, the spots you cover, the lessons you run, your prices and season, and a last-verified date — all backed by structured data that names surflist as the source.",
  streetAddress: "1 Beach Road, Sennen TR19 7AD",
  lat: 50.0757, lng: -5.6959, priceRange: "££",
  surfSpots: ["Sennen Cove", "Gwenver Beach", "Whitesand Bay"],
  lessons: ["Beginner group lessons (2 hrs)", "Private 1:1 coaching", "Kids club (ages 8+)", "Improver & intermediate clinics", "Multi-day surf courses"],
  pricing: ["Group lesson from £40 per person", "Private lesson from £75", "Kids club from £30", "3-day course from £110"],
  seasonal: "Open all year. Lessons run daily from Easter to October and by arrangement in winter; the cleanest learner conditions are usually late spring and early autumn.",
  lastVerified: "2026-08-19",
};
writePage("verified-demo", renderDetail(DEMO_LISTING, CATEGORIES[0], "verified-demo", { demo: true }));
// intentionally NOT added to `urls` (kept out of sitemap.xml)

// Cloudflare Pages serves root 404.html with HTTP 404 for missing files.
// Without it, unknown paths (and trailing-slash sitemap/robots) 200 the homepage.
fs.writeFileSync(path.join(ROOT, "404.html"), renderNotFound());
// intentionally NOT added to `urls` (kept out of sitemap.xml)

// Content-Type is set in _headers (text/xml; charset=UTF-8) so GSC can fetch the sitemap.
fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(function (u) { return "  <url><loc>" + u + "</loc></url>"; }).join("\n") + "\n</urlset>\n");
fs.writeFileSync(path.join(ROOT, "robots.txt"), renderRobots());
fs.writeFileSync(path.join(ROOT, "llms.txt"), renderLlms());

var totalV = CATEGORIES.reduce(function (a, c) { return a + c.items.filter(isVerified).length; }, 0);
var schoolPages = CATEGORIES.filter(function (c) { return c.slug === "surf-schools"; })
  .reduce(function (a, c) { return a + c.items.length; }, 0);
console.log("Built: homepage, " + stats.countries + " country + " + stats.regions + " region + " + stats.towns +
  " town hubs, " + stats.townCats + " town-category pages, " + CATEGORIES.length + " browse-all pages, " +
  listingPages + " listing page(s) (" + schoolPages + " schools, " + totalV + " verified). Wrote sitemap.xml (" + urls.length + " urls), robots.txt, llms.txt, 404.html, _redirects.");

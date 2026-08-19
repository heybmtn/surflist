/* build.js — generates the whole static site from the data files.
   Multi-category: schools, shops, stays, services. Add a category by adding a
   data/<x>.js file and one entry to CATEGORIES below — nothing else changes.
   Everything is real pre-rendered HTML (no client rendering, no layout shift,
   self-hosted font). Zero dependencies. Run:  node build.js  */

const fs = require("fs");
const path = require("path");
const shared = require("./shared.js");

const ROOT = __dirname;
const SITE = "https://surflist.co"; // change if your domain differs

/* ---------- category registry ---------- */
const CATEGORIES = [
  { slug: "surf-schools", title: "Surf schools", singular: "surf school", plural: "surf schools",
    nav: "Schools", data: "schools.js", facetField: "levels", facetLabel: "Level",
    intro: "Learn to surf or level up with schools and coaches near the break.",
    schemaType: function () { return "SportsActivityLocation"; } },

  { slug: "surf-shops", title: "Surf shops", singular: "surf shop", plural: "surf shops",
    nav: "Shops", data: "shops.js", facetField: "offerings", facetLabel: "Offers",
    intro: "Independent surf shops for boards, wetsuits, rentals and repairs.",
    schemaType: function () { return "SportingGoodsStore"; } },

  { slug: "surf-stays", title: "Places to stay", singular: "place to stay", plural: "places to stay",
    nav: "Stays", data: "stays.js", facetField: "stayType", facetLabel: "Type",
    intro: "Surf camps, hostels, eco-pods and campervans close to the waves.",
    schemaType: function (d) { return ({ Camp: "Campground", Hostel: "Hostel" })[d.stayType] || "LodgingBusiness"; } },

  { slug: "surf-services", title: "Surf services", singular: "surf service", plural: "surf services",
    nav: "Repairs", data: "services.js", facetField: "serviceType", facetLabel: "Service",
    intro: "Board repair, ding fixes and other surf services.",
    schemaType: function () { return "LocalBusiness"; } },
];

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
function slugOf(d) { return d.slug || shared.slugify(d.name); }
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
function placeholderImage(seed) {
  var h = 0; seed = String(seed || "");
  for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  var hue = 168 + (h % 28);
  var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="hsl(' + hue + ',42%,34%)"/>' +
    '<stop offset="1" stop-color="hsl(' + (hue + 14) + ',44%,22%)"/></linearGradient></defs>' +
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
  return (win.LISTINGS || []).slice().sort(function (a, b) {
    return (isVerified(b) ? 1 : 0) - (isVerified(a) ? 1 : 0) ||
      a.country.localeCompare(b.country) || a.region.localeCompare(b.region) || a.name.localeCompare(b.name);
  });
}
CATEGORIES.forEach(function (c) { c.items = loadData(c.data); });

/* ---------- shared chrome ---------- */
function nav(active) {
  return '<nav class="nav" aria-label="Categories">' + CATEGORIES.map(function (c) {
    return '<a href="/' + c.slug + '/"' + (c.slug === active ? ' aria-current="page"' : "") + ">" + esc(c.nav) + "</a>";
  }).join("") + "</nav>";
}
function header(active) {
  return '<header><div class="wrap header__inner"><a class="brand" href="/">surflist<span>.</span></a>' + nav(active) + "</div></header>\n";
}
const FOOTER =
  '<footer><div class="wrap">Run a surf school, shop or stay? Email <a href="mailto:hello@surflist.co">hello@surflist.co</a> to get listed — it\'s free.</div></footer>\n';

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
    '<link rel="stylesheet" href="/styles.css" />\n' +
    (o.jsonld ? '<script type="application/ld+json">\n' + o.jsonld + "\n</script>\n" : "") +
    "</head>\n";
}

/* ---------- card ---------- */
function renderCard(d, cat, nameTag) {
  nameTag = nameTag || "h2";
  var verified = isVerified(d);
  var name = esc(d.name);
  var place = [d.town, d.region].filter(Boolean).join(", ");
  var img = d.image ? esc(d.image) : placeholderImage(d.name);
  var vals = facetVals(d, cat);
  var tags = vals.map(function (l) { return '<span class="lvl">' + esc(l) + "</span>"; }).join("");
  var socials = socialsHtml(d.socials);
  var href = verified ? "/" + cat.slug + "/" + slugOf(d) + "/" : d.url;
  var linkText = verified ? "View" : "Visit";
  var linkAttrs = verified ? "" : ' target="_blank" rel="noopener"';
  var link = href ? '<a class="visit" href="' + esc(href) + '"' + linkAttrs + ">" + linkText + " &rarr;</a>" : "";
  var badge = verified ? '<span class="badge-verified"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.55 17.6 4.4 12.45l1.4-1.4 3.75 3.75 8-8 1.4 1.4z"/></svg>Surflist verified</span>' : "";
  var foot = (socials || link) ? '<div class="card__foot">' + socials + link + "</div>" : "";
  var media = verified
    ? '<a href="' + esc(href) + '" aria-label="' + name + '"><img src="' + img + '" alt="' + name + '" loading="lazy"></a>'
    : '<img src="' + img + '" alt="' + name + '" loading="lazy">';
  var nameHtml = verified
    ? "<" + nameTag + ' class="card__name"><a class="card__name-link" href="' + esc(href) + '">' + name + "</a></" + nameTag + ">"
    : "<" + nameTag + ' class="card__name">' + name + "</" + nameTag + ">";
  var dataFacet = vals.length ? ' data-facet="|' + esc(vals.join("|")) + '|"' : "";
  return '<li class="card' + (verified ? " is-verified" : "") + '" data-country="' + esc(d.country) + '" data-region="' + esc(d.region) + '"' + dataFacet + ">" +
    '<div class="card__media">' + media + badge + "</div>" +
    '<div class="card__body"><span class="card__place">' + esc(place) + "</span>" + nameHtml +
    (d.blurb ? '<p class="card__blurb">' + esc(d.blurb) + "</p>" : "") +
    (tags ? '<div class="card__levels">' + tags + "</div>" : "") + foot + "</div></li>";
}

/* ---------- sidebar + filter ---------- */
function opt(attr, val, label, count, active) {
  return '<button class="side-opt' + (active ? " is-active" : "") + '" type="button" ' + attr + '="' + esc(val) + '">' +
    esc(label) + (count == null ? "" : ' <span class="n">' + count + "</span>") + "</button>";
}
function renderSidebar(cat) {
  var items = cat.items;
  var html = "";
  // facet filter
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
  // country + region
  var countries = uniqSorted(items.map(function (d) { return d.country; }));
  var cbtn = opt("data-country", "All", "All", items.length, true);
  countries.forEach(function (c) {
    cbtn += opt("data-country", c, c, items.filter(function (d) { return d.country === c; }).length, false);
  });
  html += '<p class="filter-label">Country</p><div class="side-list" id="countries">' + cbtn + "</div>";
  countries.forEach(function (c) {
    var inC = items.filter(function (d) { return d.country === c; });
    var regions = uniqSorted(inC.map(function (d) { return d.region; }));
    var rbtn = opt("data-region", "All", "All", inC.length, true);
    regions.forEach(function (r) {
      rbtn += opt("data-region", r, r, inC.filter(function (d) { return d.region === r; }).length, false);
    });
    html += '<div class="region-block" data-region-for="' + esc(c) + '" hidden><p class="filter-label">Region</p><div class="side-list">' + rbtn + "</div></div>";
  });
  return '<aside class="sidebar" aria-label="Filter listings">' + html + "</aside>";
}
const FILTER_JS =
"(function(){var box=document.querySelector('.sidebar');if(!box)return;var F=document.getElementById('facets'),C=document.getElementById('countries'),cards=[].slice.call(document.querySelectorAll('#list .card')),blocks=[].slice.call(document.querySelectorAll('[data-region-for]')),el=document.getElementById('count'),noun=el.getAttribute('data-noun'),nounp=el.getAttribute('data-nounp'),st={country:'All',region:'All',facet:'All'};" +
"function act(b,a,v){[].slice.call(b.querySelectorAll('.side-opt')).forEach(function(x){x.classList.toggle('is-active',x.getAttribute(a)===v);});}" +
"function apply(){var n=0;cards.forEach(function(c){var ok=(st.country==='All'||c.getAttribute('data-country')===st.country)&&(st.region==='All'||c.getAttribute('data-region')===st.region)&&(st.facet==='All'||(c.getAttribute('data-facet')||'').indexOf('|'+st.facet+'|')>-1);c.hidden=!ok;if(ok)n++;});var where=st.country==='All'?'':' in '+(st.region==='All'?st.country:st.region+', '+st.country);el.textContent=n+' '+(n===1?noun:nounp)+where;}" +
"C.addEventListener('click',function(e){var b=e.target.closest('.side-opt');if(!b)return;st.country=b.getAttribute('data-country');st.region='All';act(C,'data-country',st.country);blocks.forEach(function(rb){rb.hidden=rb.getAttribute('data-region-for')!==st.country;});apply();});" +
"blocks.forEach(function(rb){rb.addEventListener('click',function(e){var b=e.target.closest('.side-opt');if(!b)return;st.region=b.getAttribute('data-region');act(rb,'data-region',st.region);apply();});});" +
"if(F){F.addEventListener('click',function(e){var b=e.target.closest('.side-opt');if(!b)return;st.facet=b.getAttribute('data-facet');act(F,'data-facet',st.facet);apply();});}})();";

/* ---------- category directory ---------- */
function renderCategory(cat) {
  var n = cat.items.length;
  return head({
    title: cat.title + " — surflist",
    desc: cat.intro + " Filter by country and region on surflist.",
    canonical: SITE + "/" + cat.slug + "/",
  }) +
  "<body>\n" + header(cat.slug) +
  '<main class="wrap"><div class="cat-head"><h1>' + esc(cat.title) + "</h1><p>" + esc(cat.intro) + "</p></div>" +
  '<div class="layout">' + renderSidebar(cat) +
  '<div class="main"><p class="count" id="count" aria-live="polite" data-noun="' + esc(cat.singular) + '" data-nounp="' + esc(cat.plural) + '">' +
  n + " " + (n === 1 ? cat.singular : cat.plural) + "</p>" +
  '<ul class="grid" id="list">' + cat.items.map(function (d) { return renderCard(d, cat, "h2"); }).join("") + "</ul></div></div></main>\n" +
  FOOTER + "<script>" + FILTER_JS + "</script>\n</body>\n</html>\n";
}

/* ---------- verified detail ---------- */
function surflistEntity() {
  return {
    "@type": ["Organization", "WebSite"],
    "@id": SITE + "/#surflist",
    name: "surflist",
    url: SITE,
    description: "surflist verifies and lists surf schools, shops, places to stay and surf services worldwide.",
  };
}
function jsonLd(d, cat, pageUrl) {
  var address = { "@type": "PostalAddress" };
  if (d.streetAddress) address.streetAddress = d.streetAddress;
  if (d.town) address.addressLocality = d.town;
  if (d.region) address.addressRegion = d.region;
  var cc = shared.countryCode(d.country); if (cc) address.addressCountry = cc;

  var biz = { "@type": cat.schemaType(d), "@id": pageUrl + "#business", name: d.name, address: address };
  if (d.description || d.blurb) biz.description = d.description || d.blurb;
  if (d.url) biz.url = d.url;
  if (d.image) biz.image = d.image;
  if (typeof d.lat === "number" && typeof d.lng === "number") biz.geo = { "@type": "GeoCoordinates", latitude: d.lat, longitude: d.lng };
  if (d.priceRange) biz.priceRange = d.priceRange;
  if (Array.isArray(d.surfSpots) && d.surfSpots.length) {
    biz.areaServed = d.surfSpots.map(function (s) { return { "@type": "Place", name: s }; });
  }
  var sameAs = SOCIAL_ORDER.map(function (k) { return d.socials && d.socials[k]; }).filter(Boolean);
  if (d.googleBusiness) sameAs.push(d.googleBusiness);
  if (sameAs.length) biz.sameAs = sameAs;

  // WebPage node ties the business to surflist as the verifying source/entity.
  var page = {
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: d.name + " — " + cat.singular + " on surflist",
    isPartOf: { "@id": SITE + "/#surflist" },
    about: { "@id": pageUrl + "#business" },
    mainEntity: { "@id": pageUrl + "#business" },
    reviewedBy: { "@id": SITE + "/#surflist" },
  };
  if (d.lastVerified) page.lastReviewed = d.lastVerified;

  return JSON.stringify({ "@context": "https://schema.org", "@graph": [surflistEntity(), biz, page] }, null, 2);
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
function bulletList(arr) {
  return (Array.isArray(arr) && arr.length)
    ? '<ul class="spec-list">' + arr.map(function (v) { return "<li>" + esc(v) + "</li>"; }).join("") + "</ul>"
    : "";
}
function detailSection(title, inner) {
  return inner ? '<section class="detail__section"><h2>' + esc(title) + "</h2>" + inner + "</section>" : "";
}
function renderDetail(d, cat, slug, opts) {
  opts = opts || {};
  var pageUrl = SITE + "/" + (opts.demo ? "verified-demo" : cat.slug + "/" + slug) + "/";
  var place = [d.town, d.region, d.country].filter(Boolean).join(", ");
  var img = d.image ? esc(d.image) : placeholderImage(d.name);
  var vals = facetVals(d, cat);
  var tags = vals.map(function (l) { return '<span class="lvl">' + esc(l) + "</span>"; }).join("");
  var lead = d.name + " is a Surflist-verified " + cat.singular + " in " + place + ".";
  var descText = d.description || d.blurb || "";
  var metaDesc = (descText || lead).slice(0, 155);

  var facts = "";
  function fact(dt, dd) { return "<div><dt>" + dt + "</dt><dd>" + dd + "</dd></div>"; }
  var addrLine = [d.streetAddress, d.town, d.region].filter(Boolean).join(", ");
  if (addrLine) facts += fact("Location", esc(addrLine));
  if (d.country) facts += fact("Country", esc(d.country));
  if (d.priceRange) facts += fact("Price", esc(d.priceRange));
  if (vals.length) facts += fact(esc(cat.facetLabel), esc(vals.join(", ")));
  if (typeof d.lat === "number" && typeof d.lng === "number") facts += fact("Coordinates", d.lat.toFixed(4) + ", " + d.lng.toFixed(4));
  if (d.lastVerified) facts += fact("Last verified", fmtDate(d.lastVerified));

  var cta = d.url ? '<a class="btn" href="' + esc(d.url) + '" target="_blank" rel="noopener nofollow">Visit website &rarr;</a>' : "";
  var links = socialsHtml(d.socials, d.googleBusiness);

  var sections =
    detailSection("Surf spots served", chips(d.surfSpots)) +
    detailSection("Lessons offered", bulletList(d.lessons)) +
    detailSection("Prices & experience levels", bulletList(d.pricing)) +
    (d.seasonal ? detailSection("When to go", "<p>" + esc(d.seasonal) + "</p>") : "");

  var verifiedMeta = '<p class="verified-meta">Verified by surflist' +
    (d.lastVerified ? " &middot; last checked " + fmtDate(d.lastVerified) : "") + "</p>";
  var demoBanner = opts.demo
    ? '<div class="demo-banner"><strong>Example listing.</strong> This is a demo of a Surflist verified profile, not a real business. Run a surf business? <a href="mailto:hello@surflist.co">Claim your verified listing &rarr;</a></div>'
    : "";

  return head({
    title: d.name + " — " + cat.singular + " in " + d.town + ", " + d.country + " | surflist",
    desc: metaDesc, canonical: pageUrl, ogImage: d.image || "", jsonld: jsonLd(d, cat, pageUrl),
    noindex: !!opts.demo,
  }) +
  "<body>\n" + header(cat.slug) +
  '<main class="wrap detail">' + demoBanner +
  (opts.demo ? "" : '<a class="back" href="/' + cat.slug + '/">&larr; All ' + esc(cat.plural) + "</a>\n") +
  '  <div class="detail__head"><p class="detail__eyebrow">' + esc(place) + '</p><h1 class="detail__title">' + esc(d.name) + "</h1>" +
  '<span class="badge-verified inline"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.55 17.6 4.4 12.45l1.4-1.4 3.75 3.75 8-8 1.4 1.4z"/></svg>Surflist verified</span>' + verifiedMeta + "</div>\n" +
  '  <div class="detail__media"><img src="' + img + '" alt="' + esc(d.name) + '" /></div>\n' +
  '  <div class="detail__grid"><div class="detail__body"><p class="detail__lead">' + esc(lead) + "</p>" +
  (descText ? '<div class="detail__prose"><p>' + esc(descText) + "</p></div>" : "") +
  (tags ? '<div class="tags detail__levels">' + tags + "</div>" : "") +
  sections + "</div>\n" +
  '    <aside class="detail__facts"><h2>Details</h2><dl class="facts">' + facts + "</dl>" + cta + links + "</aside>\n" +
  "  </div></main>\n" + FOOTER + "</body>\n</html>\n";
}

/* ---------- hub ---------- */
function renderHub() {
  var sections = CATEGORIES.filter(function (c) { return c.items.length; }).map(function (cat) {
    var featured = cat.items.slice(0, 6);
    return '<section class="hub-cat"><div class="hub-cat__head"><h2>' + esc(cat.title) + '</h2>' +
      '<a href="/' + cat.slug + '/">All ' + esc(cat.plural) + " &rarr;</a></div>" +
      '<ul class="grid">' + featured.map(function (d) { return renderCard(d, cat, "h3"); }).join("") + "</ul></section>";
  }).join("\n");
  return head({
    title: "surflist — surf schools, shops, stays & repairs",
    desc: "surflist is a directory for your next surf trip: find surf schools, independent shops, places to stay, and board repair — browse by country and region.",
    canonical: SITE + "/",
  }) +
  "<body>\n" + header("") +
  '<main class="wrap"><section class="hero"><h1>Surf schools, shops, stays &amp; repairs</h1>' +
  '<p>Everything for your next surf trip in one place — learn with a school, gear up at an independent shop, find somewhere to stay near the break, and get your board fixed.</p></section>\n' +
  sections + "\n</main>\n" + FOOTER + "</body>\n</html>\n";
}

/* ---------- llms.txt ---------- */
function renderLlms() {
  var out = ["# surflist", "", "> surflist is a directory for surf trips: surf schools, independent surf shops, places to stay (camps, hostels, eco-pods, campervans) and surf services like board repair. Browse by country and region. Verified listings have their own profile page with location and pricing.", "", "## Sections", ""];
  CATEGORIES.forEach(function (c) { out.push("- [" + c.title + "](" + SITE + "/" + c.slug + "/): " + c.intro); });
  out.push("");
  CATEGORIES.forEach(function (cat) {
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
  out.push("Basic listings are free and link out to each business; verified listings get a dedicated page with address, coordinates and pricing. To get listed, email hello@surflist.co.");
  out.push("");
  return out.join("\n");
}

/* ---------- write everything ---------- */
function writePage(rel, html) {
  var dir = path.join(ROOT, rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
}
// clean old generated category dirs + legacy schools/
["schools", "verified-demo"].concat(CATEGORIES.map(function (c) { return c.slug; })).forEach(function (s) {
  fs.rmSync(path.join(ROOT, s), { recursive: true, force: true });
});

fs.writeFileSync(path.join(ROOT, "index.html"), renderHub());
var urls = [SITE + "/"];
CATEGORIES.forEach(function (cat) {
  writePage(cat.slug, renderCategory(cat));
  urls.push(SITE + "/" + cat.slug + "/");
  cat.items.filter(isVerified).forEach(function (d) {
    var slug = slugOf(d);
    writePage(cat.slug + "/" + slug, renderDetail(d, cat, slug));
    urls.push(SITE + "/" + cat.slug + "/" + slug + "/");
  });
});

/* ---------- verified profile demo ----------
   A non-indexed sample of a verified listing, for showing prospective
   businesses what they get. Fictional data. Excluded from sitemap + llms.txt
   and disallowed in robots.txt below. */
var DEMO_LISTING = {
  name: "Blue Horizon Surf Co",
  country: "United Kingdom", region: "Cornwall", town: "Sennen",
  url: "https://example.com",
  blurb: "A friendly, all-abilities surf school on Cornwall's far-west coast. (Sample listing.)",
  image: "",
  verified: true,
  socials: {
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
  },
  googleBusiness: "https://www.google.com/maps",
  levels: ["Beginner", "Intermediate", "Advanced", "Kids"],
  description: "Blue Horizon is a sample profile showing what a Surflist verified listing looks like: a fuller description, the spots you cover, the lessons you run, your prices and season, and a last-verified date — all backed by structured data that names surflist as the source.",
  streetAddress: "1 Beach Road, Sennen TR19 7AD",
  lat: 50.0757, lng: -5.6959,
  priceRange: "££",
  surfSpots: ["Sennen Cove", "Gwenver Beach", "Whitesand Bay"],
  lessons: [
    "Beginner group lessons (2 hrs)",
    "Private 1:1 coaching",
    "Kids club (ages 8+)",
    "Improver & intermediate clinics",
    "Multi-day surf courses",
  ],
  pricing: [
    "Group lesson from £40 per person",
    "Private lesson from £75",
    "Kids club from £30",
    "3-day course from £110",
  ],
  seasonal: "Open all year. Lessons run daily from Easter to October and by arrangement in winter; the cleanest learner conditions are usually late spring and early autumn.",
  lastVerified: "2026-08-19",
};
writePage("verified-demo", renderDetail(DEMO_LISTING, CATEGORIES[0], "verified-demo", { demo: true }));
// NOTE: intentionally NOT pushed to `urls` (kept out of sitemap.xml).

fs.writeFileSync(path.join(ROOT, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(function (u) { return "  <url><loc>" + u + "</loc></url>"; }).join("\n") + "\n</urlset>\n");
fs.writeFileSync(path.join(ROOT, "robots.txt"), "User-agent: *\nAllow: /\nDisallow: /verified-demo/\n\nSitemap: " + SITE + "/sitemap.xml\n");
fs.writeFileSync(path.join(ROOT, "llms.txt"), renderLlms());
// migration: old /schools/<slug>/ -> /surf-schools/<slug>/
fs.writeFileSync(path.join(ROOT, "_redirects"), "/schools/* /surf-schools/:splat 301\n");

var totalV = CATEGORIES.reduce(function (a, c) { return a + c.items.filter(isVerified).length; }, 0);
console.log("Built hub + " + CATEGORIES.length + " categories, " + totalV + " verified page(s), sitemap.xml, robots.txt, llms.txt, _redirects.");
CATEGORIES.forEach(function (c) { console.log("  /" + c.slug + "/  (" + c.items.length + " listings, " + c.items.filter(isVerified).length + " verified)"); });

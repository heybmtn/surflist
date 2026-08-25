// functions/marketplace/[slug]/index.ts — GET /marketplace/:slug/
//
// The one route in this feature that isn't purely static+client-fetch: a
// listing's data doesn't exist until runtime, so there's no way to
// pre-render it at build time. One D1 read gives this page real per-listing
// <title>/OG meta (important for link previews when a listing is shared),
// plus an embedded hydration blob so marketplace-widget.js doesn't need a
// second network round trip. Existing static directory pages are untouched.
//
// Cloudflare Pages Functions intercept a matching request before static
// assets are checked, so this dynamic [slug] route would otherwise shadow
// the real static page at /marketplace/sell/ (build.js's renderMarketplaceSell)
// — "sell" is a syntactically valid slug as far as routing is concerned.
// Reserved path segments must fall through via next() to let the static
// asset serve instead.

import type { Env, PagesFunction } from "../../../lib/types";
import { getListingBySlug } from "../../../lib/db";
import { renderShell, escapeHtml } from "../../../lib/html";

const RESERVED_SLUGS = new Set(["sell"]);

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params, next }) => {
  const slug = String(params.slug ?? "");
  if (RESERVED_SLUGS.has(slug)) return next();

  const canonical = new URL(request.url).origin + "/marketplace/" + slug + "/";

  const row = slug ? await getListingBySlug(env.DB, slug) : null;

  if (!row || row.status === "pending_payment") {
    const body =
      '<main class="wrap"><section class="hero"><h1>Listing not found</h1>' +
      '<p>This listing may have been removed or sold. <a href="/marketplace/">Browse the marketplace &rarr;</a></p></section></main>';
    return new Response(
      renderShell({
        title: "Listing not found | surflist marketplace",
        desc: "This listing may have been removed or sold.",
        canonical,
        bodyHtml: body,
      }),
      { status: 404, headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  const images: string[] = JSON.parse(row.images || "[]");
  const priceDisplay = "£" + (row.price / 100).toFixed(2);
  const postedDate = new Date(row.created_at).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const body =
    '<main class="wrap">' +
    '<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span class="crumbs__sep" aria-hidden="true">/</span>' +
    '<a href="/marketplace/">Marketplace</a><span class="crumbs__sep" aria-hidden="true">/</span>' +
    '<span aria-current="page">' + escapeHtml(row.title) + "</span></nav>" +
    '<div id="marketplace-detail-root" data-slug="' + escapeHtml(slug) + '">' +
    '<section class="gallery">' +
    (images.length
      ? images.map((src) => '<div class="gallery__thumb"><img src="' + escapeHtml(src) + '" alt="" loading="lazy" /></div>').join("")
      : '<div class="gallery__thumb gallery__thumb--empty">No photos</div>') +
    "</section>" +
    '<div class="detail__facts">' +
    (row.status === "sold" ? '<p class="badge-featured">Sold</p>' : "") +
    (row.tier === "promoted" ? '<p class="badge-featured">Featured</p>' : "") +
    "<h1>" + escapeHtml(row.title) + "</h1>" +
    '<p class="price">' + priceDisplay + "</p>" +
    "<p>" + escapeHtml(row.location) + " &middot; " + escapeHtml(row.category) + "</p>" +
    "<p>Posted " + escapeHtml(postedDate) + "</p>" +
    "<p>" + escapeHtml(row.description).replace(/\n/g, "<br>") + "</p>" +
    (row.status === "sold"
      ? "<p><em>This item has been marked as sold.</em></p>"
      : '<form id="marketplace-inquiry-form" class="form-field">' +
        '<div class="form-row"><label for="buyer_name">Your name</label><input id="buyer_name" name="buyer_name" required /></div>' +
        '<div class="form-row"><label for="buyer_email">Your email</label><input id="buyer_email" name="buyer_email" type="email" required /></div>' +
        '<div class="form-row"><label for="message">Message</label><textarea id="message" name="message" required></textarea></div>' +
        '<div class="form-actions"><button type="submit" class="btn">Send Inquiry</button></div>' +
        '<div class="form-success" hidden>Your message was sent directly to the seller.</div>' +
        "</form>") +
    "</div>" +
    "</div>" +
    "</main>" +
    '<script id="listing-data" type="application/json">' +
    JSON.stringify({ ...row, images }) +
    "</script>" +
    '<script src="/marketplace-widget.js" defer></script>';

  return new Response(
    renderShell({
      title: row.title + " — " + priceDisplay + " | surflist marketplace",
      desc: escapeHtml(row.description).slice(0, 155),
      canonical,
      ogImage: images[0],
      bodyHtml: body,
    }),
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
};

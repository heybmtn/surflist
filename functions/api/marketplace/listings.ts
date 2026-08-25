// functions/api/marketplace/listings.ts — GET /api/marketplace/listings
//
// Filters: category, region_slug, max_price (pence), q (search), limit/offset.
// Ordering: promoted (still within promoted_until) strictly above free,
// then created_at DESC — enforced in lib/db.ts's SQL, not in JS.

import type { Env, PagesFunction } from "../../../lib/types";
import { jsonError, jsonOk } from "../../../lib/response";
import { listListings } from "../../../lib/db";
import { isValidCategory } from "../../../lib/validate";

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const category = url.searchParams.get("category");
  const regionSlug = url.searchParams.get("region_slug");
  const maxPriceRaw = url.searchParams.get("max_price");
  const q = url.searchParams.get("q");
  const limitRaw = url.searchParams.get("limit");
  const offsetRaw = url.searchParams.get("offset");

  if (category && !isValidCategory(category)) {
    return jsonError("VALIDATION_ERROR", "Unknown category filter.", 400);
  }

  const maxPricePence = maxPriceRaw ? Number(maxPriceRaw) : null;
  if (maxPriceRaw && (!Number.isFinite(maxPricePence) || (maxPricePence as number) < 0)) {
    return jsonError("VALIDATION_ERROR", "max_price must be a non-negative number.", 400);
  }

  try {
    const listings = await listListings(env.DB, {
      category,
      regionSlug,
      maxPricePence,
      q,
      limit: limitRaw ? Number(limitRaw) : undefined,
      offset: offsetRaw ? Number(offsetRaw) : undefined,
    });

    return jsonOk({
      listings: listings.map((row) => ({ ...row, images: JSON.parse(row.images || "[]") })),
    });
  } catch (err) {
    console.error("listListings failed", err);
    return jsonError("DB_ERROR", "Could not load listings.", 500);
  }
};

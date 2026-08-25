// functions/api/marketplace/listings/[slug].ts — GET /api/marketplace/listings/:slug

import type { Env, PagesFunction } from "../../../../lib/types";
import { jsonError, jsonOk } from "../../../../lib/response";
import { getListingBySlug } from "../../../../lib/db";

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const slug = String(params.slug ?? "");
  if (!slug) return jsonError("NOT_FOUND", "Listing not found.", 404);

  let row;
  try {
    row = await getListingBySlug(env.DB, slug);
  } catch (err) {
    console.error("getListingBySlug failed", err);
    return jsonError("DB_ERROR", "Could not load listing.", 500);
  }

  if (!row || row.status === "pending_payment") {
    return jsonError("NOT_FOUND", "Listing not found.", 404);
  }

  return jsonOk({ listing: { ...row, images: JSON.parse(row.images || "[]") } });
};

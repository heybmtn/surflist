// lib/db.ts — thin D1 query wrappers for the marketplace tables.

import type { D1Database, InquiryRow, ListingRow } from "./types";

export interface ListingFilters {
  category?: string | null;
  regionSlug?: string | null;
  maxPricePence?: number | null;
  q?: string | null;
  limit?: number;
  offset?: number;
}

export async function insertListing(db: D1Database, row: ListingRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO marketplace_listings
        (id, title, slug, description, category, board_type, dimension_length, dimension_width,
         dimension_thickness, dimension_volume, condition, price, currency, location, region_slug,
         local_pickup_only, images, seller_name, seller_email, seller_phone, external_url, tier, status,
         promoted_until, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
    .bind(
      row.id,
      row.title,
      row.slug,
      row.description,
      row.category,
      row.board_type,
      row.dimension_length,
      row.dimension_width,
      row.dimension_thickness,
      row.dimension_volume,
      row.condition,
      row.price,
      row.currency,
      row.location,
      row.region_slug,
      row.local_pickup_only,
      row.images,
      row.seller_name,
      row.seller_email,
      row.seller_phone,
      row.external_url,
      row.tier,
      row.status,
      row.promoted_until,
      row.created_at,
      row.updated_at
    )
    .run();
}

export async function getListingBySlug(db: D1Database, slug: string): Promise<ListingRow | null> {
  return db.prepare(`SELECT * FROM marketplace_listings WHERE slug = ?`).bind(slug).first<ListingRow>();
}

export async function getListingById(db: D1Database, id: string): Promise<ListingRow | null> {
  return db.prepare(`SELECT * FROM marketplace_listings WHERE id = ?`).bind(id).first<ListingRow>();
}

export async function listListings(db: D1Database, filters: ListingFilters): Promise<ListingRow[]> {
  const limit = Math.min(Math.max(filters.limit ?? 24, 1), 60);
  const offset = Math.max(filters.offset ?? 0, 0);
  const now = new Date().toISOString();

  const result = await db
    .prepare(
      `SELECT id, title, slug, category, price, currency, location, region_slug, images,
              local_pickup_only, tier, status, promoted_until, created_at
       FROM marketplace_listings
       WHERE status = 'active'
         AND (?1 IS NULL OR category = ?1)
         AND (?2 IS NULL OR region_slug = ?2)
         AND (?3 IS NULL OR price <= ?3)
         AND (?4 IS NULL OR LOWER(title) LIKE '%' || LOWER(?4) || '%')
       ORDER BY
         CASE WHEN tier = 'promoted' AND promoted_until > ?5 THEN 0 ELSE 1 END,
         created_at DESC
       LIMIT ?6 OFFSET ?7`
    )
    .bind(
      filters.category ?? null,
      filters.regionSlug ?? null,
      filters.maxPricePence ?? null,
      filters.q ?? null,
      now,
      limit,
      offset
    )
    .all<ListingRow>();

  return result.results ?? [];
}

export async function markListingPromoted(db: D1Database, listingId: string, promotedUntilIso: string): Promise<void> {
  await db
    .prepare(
      `UPDATE marketplace_listings
       SET status = 'active', tier = 'promoted', promoted_until = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(promotedUntilIso, new Date().toISOString(), listingId)
    .run();
}

export async function insertInquiry(db: D1Database, row: InquiryRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO marketplace_inquiries (id, listing_id, buyer_name, buyer_email, message, sent_at)
       VALUES (?,?,?,?,?,?)`
    )
    .bind(row.id, row.listing_id, row.buyer_name, row.buyer_email, row.message, row.sent_at)
    .run();
}

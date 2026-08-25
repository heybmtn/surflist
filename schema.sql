-- schema.sql — Marketplace / Direct Inquiry feature.
--
-- This is NOT run by build.js. A human runs it once against a NEW D1
-- database (do NOT reuse any other database in the account), e.g.:
--   wrangler d1 execute surflist-marketplace --remote --file=./schema.sql
-- or paste it into the Cloudflare dashboard's D1 console.
--
-- Timestamp note: created_at/updated_at/promoted_until are ISO-8601 strings
-- (e.g. "2026-08-25T12:00:00.000Z"), always supplied by the application via
-- new Date().toISOString() — never SQLite's CURRENT_TIMESTAMP, which emits a
-- different, non-comparable format ("YYYY-MM-DD HH:MM:SS"). Mixing the two
-- would break the "promoted_until > now" ranking rule and created_at DESC
-- ordering under plain string comparison, so there are no column defaults
-- here — every INSERT/UPDATE in lib/db.ts sets these columns explicitly.

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  description    TEXT NOT NULL,
  category       TEXT NOT NULL CHECK (category IN ('surfboards', 'wetsuits', 'accessories', 'other')),
  price          INTEGER NOT NULL CHECK (price > 0),
  currency       TEXT NOT NULL DEFAULT 'GBP',
  location       TEXT NOT NULL,
  region_slug    TEXT,
  images         TEXT NOT NULL DEFAULT '[]',
  seller_name    TEXT NOT NULL,
  seller_email   TEXT NOT NULL,
  seller_phone   TEXT,
  tier           TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'promoted')),
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_payment', 'sold', 'expired')),
  promoted_until TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_listings_status_region   ON marketplace_listings(status, region_slug);
CREATE INDEX IF NOT EXISTS idx_listings_status_category ON marketplace_listings(status, category);
CREATE INDEX IF NOT EXISTS idx_listings_created_at       ON marketplace_listings(created_at);

CREATE TABLE IF NOT EXISTS marketplace_inquiries (
  id          TEXT PRIMARY KEY,
  listing_id  TEXT NOT NULL REFERENCES marketplace_listings(id),
  buyer_name  TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  message     TEXT NOT NULL,
  sent_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_inquiries_listing_id ON marketplace_inquiries(listing_id);

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
  id                  TEXT PRIMARY KEY,
  title               TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  description         TEXT NOT NULL,
  category            TEXT NOT NULL CHECK (category IN ('surfboards', 'wetsuits', 'accessories', 'other')),
  board_type          TEXT,
  dimension_length    TEXT,
  dimension_width     TEXT,
  dimension_thickness TEXT,
  dimension_volume    TEXT,
  condition           TEXT CHECK (condition IS NULL OR condition IN ('mint', 'minor_dings_repaired', 'needs_repair', 'beater')),
  price               INTEGER NOT NULL CHECK (price > 0),
  currency            TEXT NOT NULL DEFAULT 'GBP',
  location            TEXT NOT NULL,
  region_slug         TEXT,
  local_pickup_only   INTEGER NOT NULL DEFAULT 0 CHECK (local_pickup_only IN (0, 1)),
  images              TEXT NOT NULL DEFAULT '[]',
  seller_name         TEXT NOT NULL,
  seller_email        TEXT NOT NULL,
  seller_phone        TEXT,
  external_url        TEXT,
  tier                TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'promoted')),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_payment', 'sold', 'expired')),
  promoted_until      TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

-- external_url (optional link to an existing listing elsewhere, e.g. eBay/Depop)
-- was added after the table above first shipped. On a database created before
-- this column existed, run this once against the LIVE D1 database (schema.sql
-- itself is never auto-applied — see the file header). D1's SQLite does not
-- support "ADD COLUMN IF NOT EXISTS", so only run this if the column is not
-- already present (a second run errors with "duplicate column name"):
--   wrangler d1 execute surflist-marketplace --remote --command \
--     "ALTER TABLE marketplace_listings ADD COLUMN external_url TEXT;"
-- A fresh database created from this file already has the column via the
-- CREATE TABLE above, so this statement should not be run there.

-- Surfboard detail fields (board_type, dimension_length/width/thickness/volume,
-- condition) and local_pickup_only were added after the table above first
-- shipped. On a database created before these columns existed, run each
-- statement below once against the LIVE D1 database (schema.sql itself is
-- never auto-applied — see the file header). D1's SQLite does not support
-- "ADD COLUMN IF NOT EXISTS", so only run a statement for a column that is
-- not already present (re-running one errors with "duplicate column name").
--   wrangler d1 execute surflist-marketplace --remote --command \
--     "ALTER TABLE marketplace_listings ADD COLUMN board_type TEXT;"
--   wrangler d1 execute surflist-marketplace --remote --command \
--     "ALTER TABLE marketplace_listings ADD COLUMN dimension_length TEXT;"
--   wrangler d1 execute surflist-marketplace --remote --command \
--     "ALTER TABLE marketplace_listings ADD COLUMN dimension_width TEXT;"
--   wrangler d1 execute surflist-marketplace --remote --command \
--     "ALTER TABLE marketplace_listings ADD COLUMN dimension_thickness TEXT;"
--   wrangler d1 execute surflist-marketplace --remote --command \
--     "ALTER TABLE marketplace_listings ADD COLUMN dimension_volume TEXT;"
--   wrangler d1 execute surflist-marketplace --remote --command \
--     "ALTER TABLE marketplace_listings ADD COLUMN condition TEXT CHECK (condition IS NULL OR condition IN ('mint', 'minor_dings_repaired', 'needs_repair', 'beater'));"
--   wrangler d1 execute surflist-marketplace --remote --command \
--     "ALTER TABLE marketplace_listings ADD COLUMN local_pickup_only INTEGER NOT NULL DEFAULT 0 CHECK (local_pickup_only IN (0, 1));"
-- A fresh database created from this file already has these columns via the
-- CREATE TABLE above, so these statements should not be run there.

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

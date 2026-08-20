-- Enable PostGIS (idempotent)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography columns for distance queries (kept out of the Prisma schema
-- so the app keeps working even before this migration runs).
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "geo" geography(Point, 4326);
ALTER TABLE "universities" ADD COLUMN IF NOT EXISTS "geo" geography(Point, 4326);

-- Backfill geography from existing lat/lng decimal columns
UPDATE "properties"
SET "geo" = ST_SetSRID(ST_MakePoint("longitude"::double precision, "latitude"::double precision), 4326)::geography
WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "geo" IS NULL;

UPDATE "universities"
SET "geo" = ST_SetSRID(ST_MakePoint("longitude"::double precision, "latitude"::double precision), 4326)::geography
WHERE "latitude" IS NOT NULL AND "longitude" IS NOT NULL AND "geo" IS NULL;

-- GIST indexes for fast nearest-neighbour / ST_DWithin queries
CREATE INDEX IF NOT EXISTS "properties_geo_idx" ON "properties" USING GIST ("geo");
CREATE INDEX IF NOT EXISTS "universities_geo_idx" ON "universities" USING GIST ("geo");

-- Note: listings join to properties for area-based search.
-- Individual indexes exist: listings(status, rent_amount) and properties(area).

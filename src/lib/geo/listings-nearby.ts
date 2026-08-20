import { prisma } from "@/lib/db/prisma";
import type { Listing } from "@/lib/listings";

type NearbyRow = {
  id: string;
  title: string;
  rent_amount: number;
  property_type: string;
  agent_id: string;
  verification_status: string;
  area: string;
  image_url: string | null;
  distance_m: number;
};

/**
 * Find ACTIVE listings within `radiusMeters` of a point, ordered by distance.
 *
 * Uses PostGIS `ST_DWithin` with the `geo` geography column. Returns `null`
 * when PostGIS isn't enabled or the geo columns haven't been migrated yet, so
 * callers can fall back to the regular search.
 */
export async function getListingsNearby(
  latitude: number,
  longitude: number,
  radiusMeters = 5_000,
): Promise<{ listings: Listing[]; source: "postgis" } | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  try {
    const rows = await prisma.$queryRaw<NearbyRow[]>`
      SELECT
        l.id,
        l.title,
        l.rent_amount,
        l.property_type,
        l.agent_id,
        l.verification_status,
        p.area,
        COALESCE(
          (
            SELECT li.url FROM listing_images li
            WHERE li.listing_id = l.id AND li.is_primary = true
            ORDER BY li.sort_order ASC LIMIT 1
          ),
          (
            SELECT li.url FROM listing_images li
            WHERE li.listing_id = l.id
            ORDER BY li.sort_order ASC LIMIT 1
          )
        ) AS image_url,
        ST_Distance(p.geo, ST_SetSRID(ST_MakePoint(${longitude}::float8, ${latitude}::float8), 4326)::geography) AS distance_m
      FROM listings l
      JOIN properties p ON p.id = l.property_id
      WHERE l.status = 'ACTIVE'
        AND p.geo IS NOT NULL
        AND ST_DWithin(p.geo, ST_SetSRID(ST_MakePoint(${longitude}::float8, ${latitude}::float8), 4326)::geography, ${radiusMeters})
      ORDER BY distance_m ASC
      LIMIT 24
    `;

    return {
      source: "postgis",
      listings: rows.map((row) => ({
        id: row.id,
        title: row.title,
        type: row.property_type,
        area: row.area,
        price: row.rent_amount,
        image: row.image_url ?? "/listing-placeholder.svg",
        verified:
          row.verification_status === "VERIFIED" ||
          row.verification_status === "PROPERTY_VERIFIED" ||
          row.verification_status === "OWNER_VERIFIED",
        agentId: row.agent_id,
      })),
    };
  } catch (error) {
    // PostGIS not enabled or geo columns missing — caller should fall back.
    console.warn("PostGIS nearby search unavailable, falling back.", error);
    return null;
  }
}

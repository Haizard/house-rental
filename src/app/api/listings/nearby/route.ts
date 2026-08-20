import { NextResponse } from "next/server";
import { getListingsNearby } from "@/lib/geo/listings-nearby";
import { getPublicListings } from "@/server/listings/get-public-listings";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const radius = Number(searchParams.get("radius") ?? 5000);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json(
      { error: "Valid `lat` and `lng` query parameters are required." },
      { status: 400 },
    );
  }

  const nearby = await getListingsNearby(lat, lng, radius);

  if (nearby) {
    return NextResponse.json({ data: nearby.listings, source: nearby.source });
  }

  // Fall back to the default catalog when PostGIS isn't available yet.
  const fallback = await getPublicListings();
  return NextResponse.json({
    data: fallback.listings,
    source: "fallback",
    note: "PostGIS geo index not enabled yet; returning default catalog.",
  });
}

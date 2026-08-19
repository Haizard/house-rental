import { NextResponse } from "next/server";
import { getPublicListings } from "@/server/listings/get-public-listings";

export async function GET() {
  const { listings, source } = await getPublicListings();
  return NextResponse.json({ data: listings, meta: { source, count: listings.length } });
}

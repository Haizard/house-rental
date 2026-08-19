import { NextResponse } from "next/server";
import { getPublicListings } from "@/server/listings/get-public-listings";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const { listings, source } = await getPublicListings({
    area: searchParams.get("area") ?? undefined,
    type: searchParams.get("type") ?? undefined,
    minPrice: parsePrice(searchParams.get("minPrice")),
    maxPrice: parsePrice(searchParams.get("maxPrice")),
  });
  return NextResponse.json({ data: listings, meta: { source, count: listings.length } });
}

function parsePrice(value: string | null) {
  if (!value) return undefined;
  const price = Number(value);
  return Number.isInteger(price) && price >= 0 ? price : undefined;
}

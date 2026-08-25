import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import {
  getMeilisearchClient,
  LISTINGS_INDEX,
  isMeilisearchConfigured,
  type SearchableListing,
} from "@/lib/search/meilisearch";

const searchSchema = z.object({
  q: z.string().trim().min(1).max(200),
  area: z.string().trim().max(100).optional(),
  type: z.string().trim().max(50).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().optional(),
  furnished: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

type SearchHit = {
  id: string;
  title: string;
  type: string;
  area: string;
  price: number;
  image: string;
  verified: boolean;
  agentId: string;
  _formatted?: Record<string, string>;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = searchSchema.safeParse({
    q: url.searchParams.get("q") || "",
    area: url.searchParams.get("area") || undefined,
    type: url.searchParams.get("type") || undefined,
    minPrice: url.searchParams.get("minPrice") || undefined,
    maxPrice: url.searchParams.get("maxPrice") || undefined,
    furnished: url.searchParams.get("furnished") || undefined,
    page: url.searchParams.get("page") || 1,
    limit: url.searchParams.get("limit") || 24,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search parameters." },
      { status: 400 }
    );
  }

  const { q, area, type, minPrice, maxPrice, furnished, page, limit } = parsed.data;

  // Try Meilisearch first
  if (isMeilisearchConfigured()) {
    try {
      return await searchWithMeilisearch(q, { area, type, minPrice, maxPrice, furnished, page, limit });
    } catch (err) {
      console.warn("Meilisearch search failed, falling back to Prisma:", err);
    }
  }

  // Fallback: Prisma-based search
  return await searchWithPrisma(q, { area, type, minPrice, maxPrice, furnished, page, limit });
}

async function searchWithMeilisearch(
  query: string,
  filters: { area?: string; type?: string; minPrice?: number; maxPrice?: number; furnished?: string; page: number; limit: number }
): Promise<NextResponse> {
  const ms = getMeilisearchClient();
  if (!ms) throw new Error("Meilisearch not configured");

  const index = ms.index(LISTINGS_INDEX);

  // Build Meilisearch filter expression
  const filterParts: string[] = ['status = "ACTIVE"'];
  if (filters.area) filterParts.push(`area = "${filters.area}"`);
  if (filters.type) filterParts.push(`propertyType = "${filters.type}"`);
  if (filters.minPrice) filterParts.push(`rentAmount >= ${filters.minPrice}`);
  if (filters.maxPrice) filterParts.push(`rentAmount <= ${filters.maxPrice}`);
  if (filters.furnished === "true") filterParts.push("furnished = true");

  const searchResult = await index.search<SearchableListing>(query, {
    filter: filterParts.join(" AND "),
    limit: filters.limit,
    offset: (filters.page - 1) * filters.limit,
    attributesToHighlight: ["title", "area", "description"],
    highlightPreTag: "<mark>",
    highlightPostTag: "</mark>",
  });

  const listings = searchResult.hits.map((hit) => ({
    id: hit.id,
    title: hit.title,
    type: hit.propertyType,
    area: hit.area,
    price: hit.rentAmount,
    image: hit.imageUrl || "/listing-placeholder.svg",
    verified:
      hit.verificationStatus === "VERIFIED" ||
      hit.verificationStatus === "PROPERTY_VERIFIED" ||
      hit.verificationStatus === "OWNER_VERIFIED",
    agentId: hit.agentId,
  }));

  return NextResponse.json({
    data: listings,
    total: searchResult.estimatedTotalHits || listings.length,
    page: filters.page,
    limit: filters.limit,
    source: "meilisearch",
  });
}

async function searchWithPrisma(
  query: string,
  filters: { area?: string; type?: string; minPrice?: number; maxPrice?: number; furnished?: string; page: number; limit: number }
): Promise<NextResponse> {
  const where: Record<string, unknown> = { status: "ACTIVE" };

  // Text search across title, description, area
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { property: { area: { contains: query, mode: "insensitive" } } },
      { property: { address: { contains: query, mode: "insensitive" } } },
    ];
  }

  if (filters.area) {
    where.property = { ...(where.property as Record<string, unknown>), area: { contains: filters.area, mode: "insensitive" } };
  }
  if (filters.type) {
    where.propertyType = filters.type;
  }
  if (filters.minPrice || filters.maxPrice) {
    where.rentAmount = {};
    if (filters.minPrice) (where.rentAmount as Record<string, number>).gte = filters.minPrice;
    if (filters.maxPrice) (where.rentAmount as Record<string, number>).lte = filters.maxPrice;
  }
  if (filters.furnished === "true") {
    where.furnished = true;
  }

  const [records, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        property: { select: { area: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { publishedAt: "desc" },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.listing.count({ where }),
  ]);

  const listings = records.map((l) => ({
    id: l.id,
    title: l.title,
    type: l.propertyType,
    area: l.property.area,
    price: l.rentAmount,
    image: l.images[0]?.url ?? "/listing-placeholder.svg",
    verified:
      l.verificationStatus === "VERIFIED" ||
      l.verificationStatus === "PROPERTY_VERIFIED" ||
      l.verificationStatus === "OWNER_VERIFIED",
    agentId: l.agentId,
  }));

  return NextResponse.json({
    data: listings,
    total,
    page: filters.page,
    limit: filters.limit,
    source: "prisma",
  });
}

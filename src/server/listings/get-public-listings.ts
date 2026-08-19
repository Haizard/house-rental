import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { listings as demoListings, type Listing } from "@/lib/listings";

type PublicListingRecord = Prisma.ListingGetPayload<{
  include: {
    property: { select: { area: true } };
    images: { orderBy: { sortOrder: "asc" }; take: 1 };
  };
}>;

export type PublicListingFilters = {
  area?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
};

export async function getPublicListings(filters: PublicListingFilters = {}): Promise<{ listings: Listing[]; source: "database" | "demo" }> {
  const where: Prisma.ListingWhereInput = {
    status: "ACTIVE",
    ...(filters.type ? { propertyType: filters.type } : {}),
    ...(filters.minPrice !== undefined || filters.maxPrice !== undefined ? {
      rentAmount: {
        ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
        ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
      },
    } : {}),
    ...(filters.area ? { property: { area: { contains: filters.area, mode: "insensitive" } } } : {}),
  };

  try {
    const records = await withDatabaseTimeout(prisma.listing.findMany({
      where,
      include: {
        property: { select: { area: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { publishedAt: "desc" },
      take: 24,
    }));

    if (records.length === 0) return { listings: filterDemoListings(filters), source: "demo" };

    return {
      source: "database",
      listings: records.map((record) => ({
        id: record.id,
        title: record.title,
        type: record.propertyType,
        area: record.property.area,
        price: record.rentAmount,
        image: record.images[0]?.url ?? "/listing-placeholder.svg",
        verified: record.verificationStatus === "VERIFIED" || record.verificationStatus === "PROPERTY_VERIFIED" || record.verificationStatus === "OWNER_VERIFIED",
        agentId: record.agentId,
      })),
    };
  } catch (error) {
    console.warn("Falling back to demo listings because the catalog is unavailable.", error);
    return { listings: filterDemoListings(filters), source: "demo" };
  }
}

function filterDemoListings(filters: PublicListingFilters) {
  const area = filters.area?.trim().toLowerCase();
  return demoListings.filter((listing) => {
    const matchesArea = !area || `${listing.title} ${listing.area} ${listing.type}`.toLowerCase().includes(area);
    const matchesType = !filters.type || listing.type === filters.type;
    const matchesMinPrice = filters.minPrice === undefined || listing.price >= filters.minPrice;
    const matchesMaxPrice = filters.maxPrice === undefined || listing.price <= filters.maxPrice;
    return matchesArea && matchesType && matchesMinPrice && matchesMaxPrice;
  });
}

export async function getPublicListingById(id: string): Promise<Listing | null> {
  try {
    const record = await withDatabaseTimeout(prisma.listing.findFirst({
      where: { id, status: "ACTIVE" },
      include: {
        property: { select: { area: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }));
    if (record) return toPublicListing(record);
  } catch (error) {
    console.warn("Falling back to demo listing because the catalog is unavailable.", error);
  }
  return demoListings.find((listing) => listing.id === id) ?? null;
}

function toPublicListing(record: PublicListingRecord) {
  return {
    id: record.id,
    title: record.title,
    type: record.propertyType,
    area: record.property.area,
    price: record.rentAmount,
    image: record.images[0]?.url ?? "/listing-placeholder.svg",
    verified: record.verificationStatus === "VERIFIED" || record.verificationStatus === "PROPERTY_VERIFIED" || record.verificationStatus === "OWNER_VERIFIED",
    agentId: record.agentId,
  } satisfies Listing;
}

function withDatabaseTimeout<T>(operation: Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Catalog database connection timed out.")), 5_000);
    operation.then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

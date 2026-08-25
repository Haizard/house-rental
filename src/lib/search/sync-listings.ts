import { prisma } from "@/lib/db/prisma";
import { getMeilisearchClient, LISTINGS_INDEX, isMeilisearchConfigured } from "./meilisearch";

/**
 * Convert a Prisma listing record to a Meilisearch-searchable document.
 */
function listingToSearchDoc(record: {
  id: string;
  title: string;
  description: string | null;
  propertyType: string;
  rentAmount: number;
  rentPeriod: string;
  status: string;
  verificationStatus: string;
  publishedAt: Date | null;
  createdAt: Date;
  roomSize: number | null;
  numberOfRooms: number | null;
  furnished: boolean;
  genderPreference: string;
  depositAmount: number | null;
  utilitiesIncluded: boolean;
  agentId: string;
  property: { area: string; address: string };
  images: { url: string }[];
  amenities: { amenity: { name: string } }[];
}) {
  return {
    id: record.id,
    title: record.title,
    description: record.description || "",
    propertyType: record.propertyType,
    area: record.property.area,
    address: record.property.address,
    rentAmount: record.rentAmount,
    rentPeriod: record.rentPeriod,
    status: record.status,
    verificationStatus: record.verificationStatus,
    publishedAt: record.publishedAt?.toISOString() || "",
    createdAt: record.createdAt.toISOString(),
    roomSize: record.roomSize,
    numberOfRooms: record.numberOfRooms,
    furnished: record.furnished,
    genderPreference: record.genderPreference,
    depositAmount: record.depositAmount,
    utilitiesIncluded: record.utilitiesIncluded,
    amenities: record.amenities.map((a) => a.amenity.name),
    agentId: record.agentId,
    imageUrl: record.images[0]?.url || "",
  };
}

const SELECT = {
  id: true,
  title: true,
  description: true,
  propertyType: true,
  rentAmount: true,
  rentPeriod: true,
  status: true,
  verificationStatus: true,
  publishedAt: true,
  createdAt: true,
  roomSize: true,
  numberOfRooms: true,
  furnished: true,
  genderPreference: true,
  depositAmount: true,
  utilitiesIncluded: true,
  agentId: true,
  property: { select: { area: true, address: true } },
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  amenities: { include: { amenity: { select: { name: true } } } },
};

/**
 * Index a single listing into Meilisearch.
 */
export async function indexListing(listingId: string): Promise<void> {
  if (!isMeilisearchConfigured()) return;

  const ms = getMeilisearchClient();
  if (!ms) return;

  try {
    const record = await prisma.listing.findUnique({
      where: { id: listingId },
      select: SELECT,
    });

    if (!record || record.status !== "ACTIVE") {
      // Remove from index if not active
      await ms.index(LISTINGS_INDEX).deleteDocument(listingId);
      return;
    }

    const doc = listingToSearchDoc(record);
    await ms.index(LISTINGS_INDEX).addDocuments([doc]);
  } catch (err) {
    console.warn("Meilisearch index failed for listing", listingId, err);
  }
}

/**
 * Remove a listing from the Meilisearch index.
 */
export async function removeListingFromIndex(listingId: string): Promise<void> {
  if (!isMeilisearchConfigured()) return;

  const ms = getMeilisearchClient();
  if (!ms) return;

  try {
    await ms.index(LISTINGS_INDEX).deleteDocument(listingId);
  } catch (err) {
    console.warn("Meilisearch delete failed for listing", listingId, err);
  }
}

/**
 * Full re-index: pull all active listings and push to Meilisearch.
 * Use on deploy or when settings change.
 */
export async function reindexAllListings(): Promise<{ indexed: number; errors: number }> {
  if (!isMeilisearchConfigured()) {
    return { indexed: 0, errors: 0 };
  }

  const ms = getMeilisearchClient();
  if (!ms) return { indexed: 0, errors: 0 };

  try {
    await ensureIndexExists(ms);
  } catch {
    // continue even if setup fails
  }

  let offset = 0;
  const batchSize = 100;
  let indexed = 0;
  let errors = 0;

  while (true) {
    try {
      const records = await prisma.listing.findMany({
        where: { status: "ACTIVE" },
        select: SELECT,
        skip: offset,
        take: batchSize,
      });

      if (records.length === 0) break;

      const docs = records.map((r) => {
        try {
          return listingToSearchDoc(r);
        } catch {
          errors++;
          return null;
        }
      }).filter(Boolean);

      if (docs.length > 0) {
        await ms.index(LISTINGS_INDEX).addDocuments(docs);
        indexed += docs.length;
      }

      offset += batchSize;
      if (records.length < batchSize) break;
    } catch (err) {
      console.warn("Meilisearch batch index failed:", err);
      errors++;
      break;
    }
  }

  return { indexed, errors };
}

async function ensureIndexExists(ms: ReturnType<typeof getMeilisearchClient> extends null ? never : NonNullable<ReturnType<typeof getMeilisearchClient>>) {
  try {
    await ms!.createIndex(LISTINGS_INDEX, { primaryKey: "id" });
  } catch {
    // already exists
  }
}

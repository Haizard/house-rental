import { Meilisearch } from "meilisearch";

const MEILI_HOST = process.env.MEILISEARCH_HOST || "";
const MEILI_KEY = process.env.MEILISEARCH_API_KEY || "";

let client: Meilisearch | null = null;

export const LISTINGS_INDEX = "listings";

export type SearchableListing = {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  area: string;
  address: string;
  rentAmount: number;
  rentPeriod: string;
  status: string;
  verificationStatus: string;
  publishedAt: string;
  createdAt: string;
  roomSize: number | null;
  numberOfRooms: number | null;
  furnished: boolean;
  genderPreference: string;
  depositAmount: number | null;
  utilitiesIncluded: boolean;
  amenities: string[];
  agentId: string;
  imageUrl: string;
};

export function isMeilisearchConfigured(): boolean {
  return MEILI_HOST.length > 0;
}

export function getMeilisearchClient(): Meilisearch | null {
  if (!isMeilisearchConfigured()) return null;
  if (!client) {
    client = new Meilisearch({
      host: MEILI_HOST,
      apiKey: MEILI_KEY || undefined,
    });
  }
  return client;
}

export async function ensureIndex(): Promise<void> {
  const ms = getMeilisearchClient();
  if (!ms) return;

  try {
    const index = ms.index(LISTINGS_INDEX);

    // Create index if it doesn't exist
    try {
      await ms.createIndex(LISTINGS_INDEX, { primaryKey: "id" });
    } catch {
      // Index may already exist — that's fine
    }

    // Configure searchable/filterable/sortable attributes
    await index.updateSettings({
      searchableAttributes: [
        "title",
        "description",
        "area",
        "address",
        "propertyType",
        "amenities",
      ],
      filterableAttributes: [
        "status",
        "propertyType",
        "area",
        "rentAmount",
        "furnished",
        "genderPreference",
        "verificationStatus",
      ],
      sortableAttributes: [
        "rentAmount",
        "publishedAt",
        "createdAt",
      ],
      rankingRules: [
        "words",
        "typo",
        "proximity",
        "attribute",
        "sort",
        "exactness",
      ],
    });
  } catch (err) {
    console.warn("Meilisearch index setup failed:", err);
  }
}

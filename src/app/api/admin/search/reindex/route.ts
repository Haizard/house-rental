import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { reindexAllListings } from "@/lib/search/sync-listings";
import { isMeilisearchConfigured } from "@/lib/search/meilisearch";

export async function POST() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  if (!isMeilisearchConfigured()) {
    return NextResponse.json(
      { error: "Meilisearch is not configured. Set MEILISEARCH_HOST env var." },
      { status: 503 }
    );
  }

  const result = await reindexAllListings();

  return NextResponse.json({
    success: true,
    indexed: result.indexed,
    errors: result.errors,
  });
}

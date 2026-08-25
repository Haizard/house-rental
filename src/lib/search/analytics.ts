import { prisma } from "@/lib/db/prisma";

export type SearchEvent = {
  query: string;
  filters: Record<string, unknown>;
  resultCount: number;
  source: "meilisearch" | "prisma";
  userId?: string;
};

/**
 * Log a search event for analytics.
 * Uses the existing ai_interactions table with type='SEARCH'.
 */
export async function logSearchEvent(event: SearchEvent): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO ai_interactions (id, type, user_id, input, output, provider, model, metadata, created_at)
      VALUES (
        gen_random_uuid(),
        'SEARCH',
        ${event.userId || null},
        ${event.query},
        ${JSON.stringify({ resultCount: event.resultCount, source: event.source })},
        ${event.source},
        ${event.source === "meilisearch" ? "meilisearch" : "prisma"},
        ${JSON.stringify({ filters: event.filters, resultCount: event.resultCount })}::jsonb,
        NOW()
      )
    `;
  } catch {
    // Analytics failure is non-critical
  }
}

/**
 * Get search analytics for the admin dashboard.
 */
export async function getSearchAnalytics(options: {
  days?: number;
} = {}) {
  const { days = 30 } = options;
  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    // Total searches
    const totalResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM ai_interactions
      WHERE type = 'SEARCH' AND created_at >= ${since}
    `;
    const totalSearches = Number(totalResult[0]?.count || 0);

    // Unique searchers
    const uniqueResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(DISTINCT user_id) as count FROM ai_interactions
      WHERE type = 'SEARCH' AND created_at >= ${since} AND user_id IS NOT NULL
    `;
    const uniqueSearchers = Number(uniqueResult[0]?.count || 0);

    // No-result searches (resultCount = 0)
    const noResultResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM ai_interactions
      WHERE type = 'SEARCH' AND created_at >= ${since}
      AND (output->>'resultCount')::int = 0
    `;
    const noResultSearches = Number(noResultResult[0]?.count || 0);

    // Top queries
    const topQueries = await prisma.$queryRaw<Array<{ query: string; count: bigint }>>`
      SELECT input as query, COUNT(*) as count
      FROM ai_interactions
      WHERE type = 'SEARCH' AND created_at >= ${since}
      GROUP BY input
      ORDER BY count DESC
      LIMIT 20
    `;

    // Searches per day
    const dailySearches = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM ai_interactions
      WHERE type = 'SEARCH' AND created_at >= ${since}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Source breakdown
    const sourceBreakdown = await prisma.$queryRaw<Array<{ source: string; count: bigint }>>`
      SELECT provider as source, COUNT(*) as count
      FROM ai_interactions
      WHERE type = 'SEARCH' AND created_at >= ${since}
      GROUP BY provider
    `;

    return {
      totalSearches,
      uniqueSearchers,
      noResultSearches,
      noResultRate: totalSearches > 0 ? ((noResultSearches / totalSearches) * 100).toFixed(1) : "0",
      topQueries: topQueries.map((q) => ({ query: q.query, count: Number(q.count) })),
      dailySearches: dailySearches.map((d) => ({
        date: d.date.toISOString().split("T")[0],
        count: Number(d.count),
      })),
      sourceBreakdown: sourceBreakdown.map((s) => ({
        source: s.source,
        count: Number(s.count),
      })),
    };
  } catch (err) {
    console.warn("Search analytics query failed:", err);
    return {
      totalSearches: 0,
      uniqueSearchers: 0,
      noResultSearches: 0,
      noResultRate: "0",
      topQueries: [],
      dailySearches: [],
      sourceBreakdown: [],
    };
  }
}

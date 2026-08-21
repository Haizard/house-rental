import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { Placement } from "@/lib/ads/eligibility";

const VALID_PLACEMENTS = [
  "FREE_AGENT_DASHBOARD",
  "FREE_AGENT_LISTINGS",
  "FREE_AGENT_ANALYTICS",
  "PUBLIC_SEARCH",
  "PUBLIC_LISTING",
  "PUBLIC_AREA",
  "PUBLIC_UNIVERSITY",
] as const;

/**
 * POST /api/ads/impression
 * Track an ad impression for analytics.
 * Called by the AdSlot component when an ad becomes visible.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { placement } = body as { placement?: Placement };

  if (!placement || !VALID_PLACEMENTS.includes(placement as typeof VALID_PLACEMENTS[number])) {
    return NextResponse.json({ error: "Invalid placement" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    // Upsert daily aggregate
    await prisma.$executeRaw`
      INSERT INTO ad_analytics_daily (date, placement, impressions, clicks, estimated_revenue, ctr)
      VALUES (${today}::date, ${placement}, 1, 0, 0, 0)
      ON CONFLICT (date, placement)
      DO UPDATE SET
        impressions = ad_analytics_daily.impressions + 1,
        updated_at = now()
    `;
  } catch {
    // Table might not exist yet — silently ignore
  }

  return NextResponse.json({ ok: true });
}

/**
 * POST /api/ads/impression/click
 * Track an ad click for analytics.
 */
export async function PUT(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { placement } = body as { placement?: Placement };

  if (!placement || !VALID_PLACEMENTS.includes(placement as typeof VALID_PLACEMENTS[number])) {
    return NextResponse.json({ error: "Invalid placement" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  try {
    await prisma.$executeRaw`
      INSERT INTO ad_analytics_daily (date, placement, impressions, clicks, estimated_revenue, ctr)
      VALUES (${today}::date, ${placement}, 0, 1, 0, 0)
      ON CONFLICT (date, placement)
      DO UPDATE SET
        clicks = ad_analytics_daily.clicks + 1,
        ctr = CASE
          WHEN ad_analytics_daily.impressions > 0
          THEN (ad_analytics_daily.clicks + 1)::decimal / ad_analytics_daily.impressions
          ELSE 0
        END,
        updated_at = now()
    `;
  } catch {
    // Table might not exist yet
  }

  return NextResponse.json({ ok: true });
}

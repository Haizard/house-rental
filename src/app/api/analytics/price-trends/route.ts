import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

type TrendData = {
  area: string;
  propertyType: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  listingCount: number;
  trend: "up" | "down" | "stable";
  changePercent: number;
};

/** GET — get price trends by area and property type */
export async function GET() {
  try {
    // Current period (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get current period averages
    const current = await prisma.$queryRaw<{
      area: string;
      property_type: string;
      avg_price: number;
      min_price: number;
      max_price: number;
      count: number;
    }[]>`
      SELECT
        p.area,
        l.property_type,
        ROUND(AVG(l.rent_amount)) as avg_price,
        MIN(l.rent_amount) as min_price,
        MAX(l.rent_amount) as max_price,
        COUNT(*) as count
      FROM listings l
      JOIN properties p ON p.id = l.property_id
      WHERE l.status = 'ACTIVE'
        AND l.created_at >= ${thirtyDaysAgo}
      GROUP BY p.area, l.property_type
      HAVING COUNT(*) >= 2
      ORDER BY COUNT(*) DESC
    `;

    // Get previous period averages for trend comparison
    const previous = await prisma.$queryRaw<{
      area: string;
      property_type: string;
      avg_price: number;
    }[]>`
      SELECT
        p.area,
        l.property_type,
        ROUND(AVG(l.rent_amount)) as avg_price
      FROM listings l
      JOIN properties p ON p.id = l.property_id
      WHERE l.status = 'ACTIVE'
        AND l.created_at >= ${sixtyDaysAgo}
        AND l.created_at < ${thirtyDaysAgo}
      GROUP BY p.area, l.property_type
      HAVING COUNT(*) >= 2
    `;

    // Build previous period lookup
    const prevMap = new Map<string, number>();
    for (const row of previous) {
      prevMap.set(`${row.area}|${row.property_type}`, Number(row.avg_price));
    }

    // Calculate trends
    const trends: TrendData[] = current.map((row) => {
      const key = `${row.area}|${row.property_type}`;
      const prevAvg = prevMap.get(key);
      const currentAvg = Number(row.avg_price);

      let trend: "up" | "down" | "stable" = "stable";
      let changePercent = 0;

      if (prevAvg && prevAvg > 0) {
        changePercent = ((currentAvg - prevAvg) / prevAvg) * 100;
        if (changePercent > 5) trend = "up";
        else if (changePercent < -5) trend = "down";
      }

      return {
        area: row.area,
        propertyType: row.property_type,
        avgPrice: currentAvg,
        minPrice: Number(row.min_price),
        maxPrice: Number(row.max_price),
        listingCount: Number(row.count),
        trend,
        changePercent: Math.round(changePercent),
      };
    });

    // Overall market summary
    const overall = await prisma.$queryRaw<{ avg_price: number; total: number }[]>`
      SELECT ROUND(AVG(rent_amount)) as avg_price, COUNT(*) as total
      FROM listings
      WHERE status = 'ACTIVE'
        AND created_at >= ${thirtyDaysAgo}
    `;

    return NextResponse.json({
      data: {
        trends,
        summary: {
          avgPrice: Number(overall[0]?.avg_price ?? 0),
          totalListings: Number(overall[0]?.total ?? 0),
          period: "Last 30 days",
        },
      },
    });
  } catch (error) {
    console.error("Price trends failed:", error);
    return NextResponse.json({ error: "Failed to load trends." }, { status: 500 });
  }
}

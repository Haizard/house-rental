import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Cron endpoint to check saved searches against new listings.
 * Runs daily. Creates notifications for matching listings.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searches = await prisma.savedSearch.findMany({
      include: { student: { select: { userId: true } } },
    });

    let alertsSent = 0;

    for (const search of searches) {
      const since = search.lastAlertAt ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const where: Record<string, unknown> = {
        status: "ACTIVE",
        createdAt: { gt: since },
      };
      if (search.area) where.property = { area: { contains: search.area, mode: "insensitive" } };
      if (search.propertyType) where.propertyType = search.propertyType;
      if (search.minPrice || search.maxPrice) {
        where.rentAmount = {};
        if (search.minPrice) (where.rentAmount as Record<string, number>).gte = search.minPrice;
        if (search.maxPrice) (where.rentAmount as Record<string, number>).lte = search.maxPrice;
      }

      const newMatches = await prisma.listing.findMany({
        where,
        select: { id: true, title: true },
        take: 5,
      });

      // Filter out already-alerted listings
      const unalerted = newMatches.filter(
        (l) => !search.lastAlertedListingIds.includes(l.id)
      );

      if (unalerted.length > 0) {
        await prisma.notification.create({
          data: {
            userId: search.student.userId,
            type: "SAVED_SEARCH_ALERT",
            title: `${unalerted.length} new match${unalerted.length > 1 ? "es" : ""} for your saved search`,
            message: unalerted.map((l) => l.title).join(", "),
            data: { searchId: search.id, listingIds: unalerted.map((l) => l.id) },
          },
        });

        await prisma.savedSearch.update({
          where: { id: search.id },
          data: {
            lastAlertAt: new Date(),
            lastAlertedListingIds: [
              ...search.lastAlertedListingIds,
              ...unalerted.map((l) => l.id),
            ].slice(-50), // keep last 50
          },
        });

        alertsSent++;
      }
    }

    return NextResponse.json({
      searched: searches.length,
      alertsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron] Saved search alerts failed:", error);
    return NextResponse.json({ error: "Alert check failed" }, { status: 500 });
  }
}

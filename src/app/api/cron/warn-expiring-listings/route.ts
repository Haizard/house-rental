import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Cron endpoint to warn agents about listings expiring within 7 days.
 * Runs daily. Creates notifications for each agent.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const expiringListings = await prisma.listing.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lte: sevenDaysFromNow, gt: new Date() },
      },
      include: {
        agent: { select: { userId: true } },
        property: { select: { area: true } },
      },
    });

    let notificationsSent = 0;

    // Group by agent to send one notification per agent
    const byAgent = new Map<string, { userId: string; listings: typeof expiringListings }>();
    for (const listing of expiringListings) {
      const key = listing.agentId;
      if (!byAgent.has(key)) {
        byAgent.set(key, { userId: listing.agent.userId, listings: [] });
      }
      byAgent.get(key)!.listings.push(listing);
    }

    for (const [, { userId, listings }] of byAgent) {
      const daysLeft = Math.ceil(
        (listings[0].expiresAt!.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );

      await prisma.notification.create({
        data: {
          userId,
          type: "LISTING_EXPIRING",
          title: `${listings.length} listing${listings.length > 1 ? "s" : ""} expiring soon`,
          message: `Your listing${listings.length > 1 ? "s" : ""} in ${listings[0].property.area} ${listings.length > 1 ? "are" : "is"} expiring in ${daysLeft} day${daysLeft > 1 ? "s" : ""}. Renew to keep getting leads.`,
          data: {
            listingIds: listings.map((l) => l.id),
            daysLeft,
          },
        },
      });
      notificationsSent++;
    }

    return NextResponse.json({
      expiringListings: expiringListings.length,
      notificationsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron] Listing expiry warnings failed:", error);
    return NextResponse.json({ error: "Warning check failed" }, { status: 500 });
  }
}

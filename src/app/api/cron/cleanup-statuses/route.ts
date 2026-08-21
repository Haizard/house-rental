import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Cron endpoint to delete expired agent statuses.
 * Deploy as a Vercel Cron Job or call manually.
 * Add to vercel.json: { "crons": [{ "path": "/api/cron/cleanup-statuses", "schedule": "0 * * * *" }] }
 */
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete all statuses where expiresAt is in the past
    const result = await prisma.agentStatus.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    console.log(`[cron] Cleaned up ${result.count} expired statuses`);
    return NextResponse.json({
      deleted: result.count,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron] Failed to clean up statuses:", error);
    return NextResponse.json(
      { error: "Cleanup failed" },
      { status: 500 },
    );
  }
}

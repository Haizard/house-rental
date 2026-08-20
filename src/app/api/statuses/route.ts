import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

export async function GET() {
  const session = await auth();

  // The agent_statuses / status_views tables may not exist yet (migration pending).
  try {
    // Get all non-expired statuses from verified/active agents
    const statuses = await prisma.agentStatus.findMany({
      where: {
        expiresAt: { gt: new Date() },
        agent: {
          user: { isActive: true },
        },
      },
      include: {
        agent: {
          select: {
            id: true,
            businessName: true,
            photoUrl: true,
            verification: true,
          },
        },
        _count: { select: { views: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // If logged in, check which statuses the user has viewed
    let viewedIds = new Set<string>();
    if (session?.user) {
      try {
        const views = await prisma.statusView.findMany({
          where: {
            viewerId: session.user.id,
            statusId: { in: statuses.map((s) => s.id) },
          },
          select: { statusId: true },
        });
        viewedIds = new Set(views.map((v) => v.statusId));
      } catch {
        // status_views table missing — treat everything as unviewed
      }
    }

    // Group by agent
    const byAgent = new Map<
      string,
      {
        agent: (typeof statuses)[number]["agent"];
        statuses: (typeof statuses)[number][];
      }
    >();

    for (const status of statuses) {
      const key = status.agent.id;
      if (!byAgent.has(key)) {
        byAgent.set(key, { agent: status.agent, statuses: [] });
      }
      byAgent.get(key)!.statuses.push(status);
    }

    return NextResponse.json({
      agents: Array.from(byAgent.values()),
      viewedIds: Array.from(viewedIds),
    });
  } catch (error) {
    console.warn("agent_statuses table unavailable for GET.", error);
    return NextResponse.json({ agents: [], viewedIds: [] });
  }
}

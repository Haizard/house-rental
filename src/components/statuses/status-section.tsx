import { prisma } from "@/lib/db/prisma";
import { StatusViewer } from "./status-viewer";

export async function StatusSection() {
  let statuses: Awaited<ReturnType<typeof fetchStatuses>> = [];

  try {
    statuses = await fetchStatuses();
  } catch {
    // Table may not exist yet (migration pending) — render nothing
    return null;
  }

  if (statuses.length === 0) return null;

  // Group by agent
  const byAgent = new Map<
    string,
    { agent: (typeof statuses)[number]["agent"]; statuses: (typeof statuses)[number][] }
  >();

  for (const status of statuses) {
    const key = status.agent.id;
    if (!byAgent.has(key)) {
      byAgent.set(key, { agent: status.agent, statuses: [] });
    }
    byAgent.get(key)!.statuses.push(status);
  }

  return (
    <StatusViewer
      agents={Array.from(byAgent.values())}
      viewedIds={[]}
    />
  );
}

async function fetchStatuses() {
  return prisma.agentStatus.findMany({
    where: {
      expiresAt: { gt: new Date() },
      agent: { user: { isActive: true } },
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
    take: 30,
  });
}

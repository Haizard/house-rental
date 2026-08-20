import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { StatusPost } from "@/components/agent/status-post";

export default async function AgentStatusesPage() {
  const session = await requireRole("AGENT");
  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, tier: true },
  });
  if (!agent) return null;

  // Count today's statuses (table may not exist yet)
  let dailyUsed = 0;
  let statuses: { id: string; content: string; expiresAt: Date; _count: { views: number } }[] = [];
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    dailyUsed = await prisma.agentStatus.count({
      where: { agentId: agent.id, createdAt: { gte: todayStart } },
    });
    statuses = await prisma.agentStatus.findMany({
      where: { agentId: agent.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { views: true } } },
    });
  } catch {
    // agent_statuses table not yet migrated
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Agent workspace</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Status</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Post temporary updates about available rooms. Statuses expire after 24 hours.
        </p>
      </header>

      <StatusPost
        dailyUsed={dailyUsed}
        dailyLimit={agent.tier === "PRO" ? 999 : 3}
        tier={agent.tier}
      />

      <section className="mt-8">
        <h2 className="text-xl font-bold">Active statuses</h2>
        {statuses.length === 0 ? (
          <div className="glass-surface mt-4 p-6 text-sm text-[var(--text-secondary)]">
            No active statuses. Post one above to let students know about available rooms.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {statuses.map((s) => (
              <article className="glass-surface p-4" key={s.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{s.content}</p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      Expires{" "}
                      {new Intl.DateTimeFormat("en-TZ", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(s.expiresAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-[var(--text-secondary)]">
                    {s._count.views} view{s._count.views !== 1 ? "s" : ""}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

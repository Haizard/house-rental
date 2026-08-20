import { Home, MessageCircle, TrendingUp, Users } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";

export default async function AgentAnalyticsPage() {
  const session = await requireRole("AGENT");
  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    totalListings,
    activeListings,
    monthlyLeads,
    lastMonthLeads,
    totalLeads,
    rentedLeads,
    monthlyViewings,
    completedViewings,
  ] = await Promise.all([
    prisma.listing.count({ where: { agentId: agent.id } }),
    prisma.listing.count({ where: { agentId: agent.id, status: "ACTIVE" } }),
    prisma.lead.count({ where: { agentId: agent.id, createdAt: { gte: monthStart } } }),
    prisma.lead.count({ where: { agentId: agent.id, createdAt: { gte: lastMonthStart, lt: monthStart } } }),
    prisma.lead.count({ where: { agentId: agent.id } }),
    prisma.lead.count({ where: { agentId: agent.id, status: "RENTED" } }),
    prisma.viewingRequest.count({
      where: { lead: { agentId: agent.id }, createdAt: { gte: monthStart } },
    }),
    prisma.viewingRequest.count({
      where: { lead: { agentId: agent.id }, status: "COMPLETED" },
    }),
  ]);

  const conversionRate = totalLeads > 0 ? ((rentedLeads / totalLeads) * 100).toFixed(1) : "0";
  const leadGrowth = lastMonthLeads > 0
    ? (((monthlyLeads - lastMonthLeads) / lastMonthLeads) * 100).toFixed(0)
    : monthlyLeads > 0 ? "100" : "0";

  return (
    <div className="mx-auto max-w-5xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Agent workspace</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Analytics</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Your performance metrics and trends.
        </p>
      </header>

      {/* Key metrics */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Home size={20} />}
          value={activeListings}
          label="Active listings"
          detail={`${totalListings} total`}
        />
        <MetricCard
          icon={<Users size={20} />}
          value={monthlyLeads}
          label="Leads this month"
          detail={`${leadGrowth >= "0" ? "+" : ""}${leadGrowth}% vs last month`}
          trend={Number(leadGrowth) >= 0 ? "up" : "down"}
        />
        <MetricCard
          icon={<MessageCircle size={20} />}
          value={monthlyViewings}
          label="Viewings requested"
          detail={`${completedViewings} completed`}
        />
        <MetricCard
          icon={<TrendingUp size={20} />}
          value={`${conversionRate}%`}
          label="Conversion rate"
          detail={`${rentedLeads} rentals from ${totalLeads} leads`}
        />
      </section>

      {/* Lead pipeline */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">Lead pipeline</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Current distribution of leads by status.
        </p>
        <div className="mt-4 space-y-2">
          {["NEW", "CONTACTED", "VIEWING_REQUESTED", "NEGOTIATING", "RENTED", "CLOSED", "LOST"].map(
            async (status) => {
              const count = await prisma.lead.count({
                where: { agentId: agent.id, status: status as never },
              });
              const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
              return (
                <div className="glass-surface flex items-center gap-3 p-3" key={status}>
                  <span className="w-32 text-sm font-medium">
                    {status.replaceAll("_", " ").toLowerCase()}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-base-alt)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-right text-sm font-semibold">{count}</span>
                </div>
              );
            },
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  value,
  label,
  detail,
  trend,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  detail: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="glass-surface flex items-center gap-3 p-4">
      <span className="flex size-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </span>
      <div>
        <strong className="block text-xl">{value}</strong>
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        <span
          className="block text-xs"
          style={{
            color: trend === "down" ? "var(--danger)" : "var(--text-tertiary)",
          }}
        >
          {detail}
        </span>
      </div>
    </div>
  );
}

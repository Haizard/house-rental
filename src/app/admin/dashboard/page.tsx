import { IconBadgeInline } from "@/components/ui/icon-badge";
import { prisma } from "@/lib/db/prisma";
import { IconBadgeInline } from "@/components/ui/icon-badge";
import {
  AlertTriangle,
  BadgeCheck,
  Home,
  MessageCircle,
  Users,
} from "lucide-react";

export default async function AdminDashboardPage() {
  // Supply metrics
  const [
    totalUsers,
    activeUsers,
    totalAgents,
    verifiedAgents,
    totalListings,
    activeListings,
    totalLeads,
    openReports,
    pendingVerifications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.agentProfile.count(),
    prisma.agentProfile.count({
      where: { verification: { in: ["VERIFIED", "AGENT_VERIFIED"] } },
    }),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.lead.count(),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.verificationRecord.count({
      where: { targetType: "AGENT", status: "PENDING" },
    }),
  ]);

  // Recent activity
  const recentLeads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      student: { include: { user: { select: { firstName: true, lastName: true } } } },
      agent: { select: { businessName: true } },
      listing: { select: { title: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Platform administration</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Platform health and key metrics at a glance.
        </p>
      </header>

      {/* Metric cards — 2-col mobile / 3-col desktop per design system §8 */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
        <MetricCard
          icon={<IconBadgeInline icon={Users} gradient="blue" size="size-8" iconSize={16} />}
          value={totalUsers}
          label="Total users"
          detail={`${activeUsers} active`}
        />
        <MetricCard
          icon={<IconBadgeInline icon={BadgeCheck} gradient="green" size="size-8" iconSize={16} />}
          value={totalAgents}
          label="Agents"
          detail={`${verifiedAgents} verified`}
        />
        <MetricCard
          icon={<IconBadgeInline icon={Home} gradient="teal" size="size-8" iconSize={16} />}
          value={totalListings}
          label="Listings"
          detail={`${activeListings} active`}
        />
        <MetricCard
          icon={<IconBadgeInline icon={MessageCircle} gradient="green" size="size-8" iconSize={16} />}
          value={totalLeads}
          label="Total leads"
          detail="All time"
        />
        <MetricCard
          icon={<IconBadgeInline icon={AlertTriangle} gradient="orange" size="size-8" iconSize={16} />}
          value={openReports}
          label="Open reports"
          detail="Awaiting review"
          accent={openReports > 0 ? "warning" : undefined}
        />
        <MetricCard
          icon={<IconBadgeInline icon={Users} gradient="blue" size="size-8" iconSize={16} />}
          value={pendingVerifications}
          label="Pending verifications"
          detail="Awaiting review"
          accent={pendingVerifications > 0 ? "info" : undefined}
        />
      </section>

      {/* Recent leads */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">Recent leads</h2>
        <div className="mt-4 space-y-3">
          {recentLeads.length ? (
            recentLeads.map((lead) => (
              <article
                className="glass-surface flex items-center gap-4 p-4"
                key={lead.id}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {lead.student.user.firstName}{" "}
                    {lead.student.user.lastName}
                  </p>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    {lead.listing.title} · {lead.agent.businessName}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                    {new Intl.DateTimeFormat("en-TZ", {
                      dateStyle: "medium",
                    }).format(lead.createdAt)}
                  </p>
                </div>
                <span
                  className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    background:
                      lead.status === "NEW"
                        ? "var(--warning-soft)"
                        : "var(--accent-soft)",
                    color:
                      lead.status === "NEW"
                        ? "var(--warning)"
                        : "var(--accent)",
                  }}
                >
                  {lead.status.replaceAll("_", " ").toLowerCase()}
                </span>
              </article>
            ))
          ) : (
            <div className="glass-surface p-6 text-sm text-[var(--text-secondary)]">
              No leads yet.
            </div>
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
  accent,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  detail: string;
  accent?: "warning" | "info";
}) {
  return (
    <div className="glass-surface overflow-hidden p-3.5 sm:p-4">
      <div className="flex items-center gap-2.5">
        <div className="size-8 shrink-0 sm:size-9">{icon}</div>
        <div className="min-w-0">
          <strong className="block text-lg font-bold tabular-nums text-[var(--text-primary)] sm:text-xl">{value}</strong>
          <span className="block truncate text-xs text-[var(--text-secondary)] sm:text-sm">{label}</span>
          <span className="block truncate text-[10px] text-[var(--text-tertiary)] sm:text-xs">{detail}</span>
        </div>
      </div>
    </div>
  );
}

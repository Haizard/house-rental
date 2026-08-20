import { prisma } from "@/lib/db/prisma";
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
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          icon={<Users size={20} />}
          value={totalUsers}
          label="Total users"
          detail={`${activeUsers} active`}
        />
        <MetricCard
          icon={<BadgeCheck size={20} />}
          value={totalAgents}
          label="Agents"
          detail={`${verifiedAgents} verified`}
        />
        <MetricCard
          icon={<Home size={20} />}
          value={totalListings}
          label="Listings"
          detail={`${activeListings} active`}
        />
        <MetricCard
          icon={<MessageCircle size={20} />}
          value={totalLeads}
          label="Total leads"
          detail="All time"
        />
        <MetricCard
          icon={<AlertTriangle size={20} />}
          value={openReports}
          label="Open reports"
          detail="Awaiting review"
          accent={openReports > 0 ? "warning" : undefined}
        />
        <MetricCard
          icon={<Users size={20} />}
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
    <div className="glass-surface flex items-center gap-3 p-4">
      <span
        className={`flex size-10 items-center justify-center rounded-full text-[var(--accent)]`}
        style={{
          background: accent === "warning"
            ? "var(--warning-soft)"
            : accent === "info"
              ? "rgba(90,200,250,.14)"
              : "var(--accent-soft)",
          color: accent === "warning"
            ? "var(--warning)"
            : accent === "info"
              ? "var(--info)"
              : "var(--accent)",
        }}
      >
        {icon}
      </span>
      <div>
        <strong className="block text-xl">{value}</strong>
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
        <span className="block text-xs text-[var(--text-tertiary)]">
          {detail}
        </span>
      </div>
    </div>
  );
}

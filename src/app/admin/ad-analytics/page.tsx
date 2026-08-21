import { BarChart3, TrendingUp, Users, DollarSign, Eye, MousePointer } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export default async function AdminAdAnalyticsPage() {
  await requireRole("ADMIN");

  // Overall ad metrics
  let overallMetrics = { impressions: 0, clicks: 0, ctr: 0, estimatedRevenue: 0 };
  try {
    const rows = await prisma.$queryRaw<{ impressions: number; clicks: number; ctr: number; estimated_revenue: number }[]>`
      SELECT
        COALESCE(SUM(impressions), 0) as impressions,
        COALESCE(SUM(clicks), 0) as clicks,
        CASE WHEN SUM(impressions) > 0 THEN SUM(clicks)::decimal / SUM(impressions) ELSE 0 END as ctr,
        COALESCE(SUM(estimated_revenue), 0) as estimated_revenue
      FROM ad_analytics_daily
    `;
    if (rows[0]) {
      overallMetrics = {
        impressions: Number(rows[0].impressions),
        clicks: Number(rows[0].clicks),
        ctr: Number(rows[0].ctr),
        estimatedRevenue: Number(rows[0].estimated_revenue),
      };
    }
  } catch { /* table may not exist */ }

  // By placement
  let placementMetrics: { placement: string; impressions: number; clicks: number; ctr: number }[] = [];
  try {
    placementMetrics = await prisma.$queryRaw<{ placement: string; impressions: number; clicks: number; ctr: number }[]>`
      SELECT
        placement,
        COALESCE(SUM(impressions), 0) as impressions,
        COALESCE(SUM(clicks), 0) as clicks,
        CASE WHEN SUM(impressions) > 0 THEN SUM(clicks)::decimal / SUM(impressions) ELSE 0 END as ctr
      FROM ad_analytics_daily
      GROUP BY placement
      ORDER BY SUM(impressions) DESC
    `;
  } catch { /* table may not exist */ }

  // Free vs Pro agents
  let freeAgentCount = 0;
  let proAgentCount = 0;
  try {
    const agentRows = await prisma.$queryRaw<{ tier?: string; count: number }[]>`
      SELECT
        COALESCE(
          (SELECT tier FROM agent_profiles ap WHERE ap.id = a.id),
          'FREE'
        ) as tier,
        COUNT(*) as count
      FROM agent_profiles a
      GROUP BY tier
    `;
    for (const row of agentRows) {
      if (row.tier === "PRO") proAgentCount = Number(row.count);
      else freeAgentCount += Number(row.count);
    }
  } catch { /* fallback */ }

  // Recent daily trend (last 30 days)
  let dailyTrend: { date: string; impressions: number; clicks: number; estimated_revenue: number }[] = [];
  try {
    dailyTrend = await prisma.$queryRaw<{ date: string; impressions: number; clicks: number; estimated_revenue: number }[]>`
      SELECT
        date::text,
        SUM(impressions) as impressions,
        SUM(clicks) as clicks,
        SUM(estimated_revenue) as estimated_revenue
      FROM ad_analytics_daily
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY date
      ORDER BY date DESC
      LIMIT 30
    `;
  } catch { /* table may not exist */ }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatPct = (value: number) => `${(value * 100).toFixed(2)}%`;

  return (
    <main className="min-h-screen px-4 py-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <header className="pb-8 pt-10">
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Ad Analytics</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Track advertising performance and Free vs Pro economics.
          </p>
        </header>

        {/* Overall metrics */}
        <section className="grid gap-3 sm:grid-cols-4">
          <MetricCard
            icon={<Eye size={20} />}
            label="Total Impressions"
            value={overallMetrics.impressions.toLocaleString()}
          />
          <MetricCard
            icon={<MousePointer size={20} />}
            label="Total Clicks"
            value={overallMetrics.clicks.toLocaleString()}
          />
          <MetricCard
            icon={<TrendingUp size={20} />}
            label="CTR"
            value={formatPct(overallMetrics.ctr)}
          />
          <MetricCard
            icon={<DollarSign size={20} />}
            label="Estimated Revenue"
            value={formatCurrency(overallMetrics.estimatedRevenue)}
          />
        </section>

        {/* Free vs Pro */}
        <section className="glass-surface mt-6 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Users size={18} /> Free vs Pro Agents
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4 text-center">
              <p className="text-3xl font-bold text-[var(--text-primary)]">{freeAgentCount}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Free Agents</p>
              <p className="mt-0.5 text-[11px] text-gray-400">Ads enabled</p>
            </div>
            <div className="rounded-xl bg-[var(--accent-soft)] p-4 text-center">
              <p className="text-3xl font-bold text-[var(--accent)]">{proAgentCount}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Pro Agents</p>
              <p className="mt-0.5 text-[11px] text-gray-400">TZS 20,000/mo</p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 text-center">
              <p className="text-3xl font-bold text-emerald-700">
                {freeAgentCount > 0 ? formatCurrency(overallMetrics.estimatedRevenue / freeAgentCount) : "$0.00"}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Est. Revenue / Free Agent</p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                vs TZS 20,000 ({proAgentCount} × Pro)
              </p>
            </div>
          </div>
        </section>

        {/* By Placement */}
        <section className="glass-surface mt-6 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <BarChart3 size={18} /> By Placement
          </h2>
          {placementMetrics.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              No ad data yet. Data will appear once ads start serving.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {placementMetrics.map((pm) => (
                <div
                  key={pm.placement}
                  className="flex items-center justify-between rounded-xl bg-white/40 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {pm.placement.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {Number(pm.impressions).toLocaleString()} impressions · {Number(pm.clicks).toLocaleString()} clicks
                    </p>
                  </div>
                  <span className="text-sm font-medium text-[var(--accent)]">
                    {formatPct(Number(pm.ctr))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Daily Trend */}
        <section className="glass-surface mt-6 rounded-2xl p-5">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <TrendingUp size={18} /> Daily Trend (Last 30 Days)
          </h2>
          {dailyTrend.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              No daily data yet.
            </p>
          ) : (
            <div className="mt-4 space-y-1">
              {dailyTrend.map((day) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                >
                  <span className="text-[var(--text-secondary)]">{day.date}</span>
                  <span className="font-medium">{Number(day.impressions).toLocaleString()} imp</span>
                  <span className="text-[var(--accent)]">{Number(day.clicks).toLocaleString()} clicks</span>
                  <span className="text-emerald-600">{formatCurrency(Number(day.estimated_revenue))}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-surface flex items-center gap-3 p-4">
      <span className="flex size-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </span>
      <span>
        <strong className="block text-xl">{value}</strong>
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </span>
    </div>
  );
}

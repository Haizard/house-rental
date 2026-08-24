"use client";

import { TrendingUp, Clock, Eye, Target, Star, BarChart3, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type PerformanceMetrics = {
  responseRate: number;
  avgResponseMinutes: number | null;
  totalLeads: number;
  leadsThisMonth: number;
  totalListings: number;
  activeListings: number;
  inquiryToViewingRate: number;
  viewingToRentedRate: number;
  overallConversionRate: number;
  leadsByStatus: Record<string, number>;
  performanceScore: number;
};

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agent/performance")
      .then((r) => r.json())
      .then((d) => { if (d.data) setMetrics(d.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (!metrics) return null;

  const scoreColor =
    metrics.performanceScore >= 80 ? "text-emerald-600" :
    metrics.performanceScore >= 60 ? "text-[var(--accent)]" :
    metrics.performanceScore >= 40 ? "text-amber-600" : "text-red-500";

  const scoreLabel =
    metrics.performanceScore >= 80 ? "Excellent" :
    metrics.performanceScore >= 60 ? "Good" :
    metrics.performanceScore >= 40 ? "Fair" : "Needs improvement";

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <div className="glass-surface flex items-center gap-5 p-5">
        <div className="relative flex size-20 shrink-0 items-center justify-center">
          {/* Circular progress */}
          <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="35" fill="none" stroke="var(--glass-border)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="35" fill="none"
              stroke="var(--accent)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${(metrics.performanceScore / 100) * 220} 220`}
              className="transition-all duration-1000"
            />
          </svg>
          <span className={`absolute text-xl font-bold ${scoreColor}`}>
            {metrics.performanceScore}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            Performance Score
          </h3>
          <p className={`text-sm font-medium ${scoreColor}`}>{scoreLabel}</p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            Based on response rate, conversions, and activity
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<Clock size={18} />}
          label="Response Rate"
          value={`${metrics.responseRate}%`}
          subtext={metrics.avgResponseMinutes ? `Avg ${metrics.avgResponseMinutes < 60 ? `${metrics.avgResponseMinutes}min` : `${Math.round(metrics.avgResponseMinutes / 60)}h`}` : "No data"}
          color="var(--accent)"
        />
        <MetricCard
          icon={<Eye size={18} />}
          label="Total Leads"
          value={String(metrics.totalLeads)}
          subtext={`${metrics.leadsThisMonth} this month`}
          color="var(--purple)"
        />
        <MetricCard
          icon={<Target size={18} />}
          label="Conversion"
          value={`${metrics.overallConversionRate}%`}
          subtext={`${metrics.inquiryToViewingRate}% inquiry→viewing`}
          color="var(--success)"
        />
        <MetricCard
          icon={<BarChart3 size={18} />}
          label="Active Listings"
          value={String(metrics.activeListings)}
          subtext={`${metrics.totalListings} total`}
          color="var(--cyan)"
        />
      </div>

      {/* Lead Pipeline */}
      <div className="glass-surface p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
          <TrendingUp size={16} className="text-[var(--accent)]" />
          Lead Pipeline
        </h3>
        <div className="space-y-3">
          {Object.entries(metrics.leadsByStatus).map(([status, count]) => {
            const maxCount = Math.max(...Object.values(metrics.leadsByStatus), 1);
            const width = (count / maxCount) * 100;
            return (
              <div key={status}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {status.replace(/_/g, " ").toLowerCase()}
                  </span>
                  <span className="text-xs font-bold text-[var(--accent)]">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--glass-fill)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-purple-400"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-surface p-4 text-center">
          <p className="text-2xl font-bold text-[var(--accent)]">
            {metrics.inquiryToViewingRate}%
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Inquiry → Viewing
          </p>
        </div>
        <div className="glass-surface p-4 text-center">
          <p className="text-2xl font-bold text-[var(--accent)]">
            {metrics.viewingToRentedRate}%
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Viewing → Rented
          </p>
        </div>
        <div className="glass-surface p-4 text-center">
          <p className="text-2xl font-bold text-[var(--accent)]">
            {metrics.leadsThisMonth}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Leads This Month
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: string;
}) {
  return (
    <div className="glass-surface p-4">
      <div className="flex items-center gap-2">
        <div
          className="flex size-8 items-center justify-center rounded-full"
          style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">{subtext}</p>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Search,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Clock,
  RefreshCw,
} from "lucide-react";

type AnalyticsData = {
  totalSearches: number;
  uniqueSearchers: number;
  noResultSearches: number;
  noResultRate: string;
  topQueries: Array<{ query: string; count: number }>;
  dailySearches: Array<{ date: string; count: number }>;
  sourceBreakdown: Array<{ source: string; count: number }>;
};

export function SearchAnalyticsContent() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/search/analytics?days=${days}`);
      const json = await res.json();
      setData(json.data);
    } catch {
      console.error("Failed to fetch analytics");
    }
    setLoading(false);
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-10">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      </div>
    );
  }

  const maxDaily = Math.max(...(data?.dailySearches.map((d) => d.count) || [1]));

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[var(--text-tertiary)]">Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
            Search Analytics
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Track how students search for listings
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="button button-glass flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Period selector */}
      <div className="mb-6 flex items-center gap-2">
        {[7, 14, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`inline-flex items-center justify-center rounded-full px-3 py-1.5 text-xs font-medium transition ${
              days === d
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--glass-fill)] text-[var(--text-secondary)] hover:bg-[var(--accent)]/10"
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Stats cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-surface p-5">
          <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
            <Search size={16} className="text-[var(--accent)]" />
            <span className="text-xs font-medium">Total Searches</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
            {data?.totalSearches.toLocaleString() || "0"}
          </p>
        </div>

        <div className="glass-surface p-5">
          <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
            <TrendingUp size={16} className="text-[#FBC618]" />
            <span className="text-xs font-medium">Unique Searchers</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
            {data?.uniqueSearchers.toLocaleString() || "0"}
          </p>
        </div>

        <div className="glass-surface p-5">
          <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
            <AlertTriangle size={16} className="text-orange-500" />
            <span className="text-xs font-medium">No Results</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
            {data?.noResultSearches.toLocaleString() || "0"}
          </p>
          <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
            {data?.noResultRate || "0"}% of searches
          </p>
        </div>

        <div className="glass-surface p-5">
          <div className="flex items-center gap-2 text-[var(--text-tertiary)]">
            <BarChart3 size={16} className="text-[#FBC618]" />
            <span className="text-xs font-medium">Avg / Day</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">
            {data?.dailySearches.length
              ? Math.round(
                  data.dailySearches.reduce((s, d) => s + d.count, 0) /
                    data.dailySearches.length
                )
              : "0"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily searches chart */}
        <div className="glass-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Searches per Day
            </h3>
          </div>
          <div className="flex h-48 items-end gap-1">
            {data?.dailySearches.map((day) => (
              <div
                key={day.date}
                className="group flex flex-1 flex-col items-center"
              >
                <div
                  className="w-full rounded-t-sm bg-[var(--accent)]/70 transition hover:bg-[var(--accent)]"
                  style={{
                    height: `${Math.max(4, (day.count / maxDaily) * 100)}%`,
                  }}
                  title={`${day.date}: ${day.count} searches`}
                />
                {/* Show date label for every 5th bar */}
                {data.dailySearches.indexOf(day) % 5 === 0 && (
                  <span className="mt-1 text-[8px] text-[var(--text-tertiary)]">
                    {day.date.slice(5)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Source breakdown */}
        <div className="glass-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Search size={16} className="text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Search Source Breakdown
            </h3>
          </div>
          {data?.sourceBreakdown && data.sourceBreakdown.length > 0 ? (
            <div className="space-y-3">
              {data.sourceBreakdown.map((source) => {
                const total = data.sourceBreakdown.reduce(
                  (s, x) => s + x.count,
                  0
                );
                const pct = total > 0 ? (source.count / total) * 100 : 0;
                return (
                  <div key={source.source}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-[var(--text-primary)] capitalize">
                        {source.source}
                      </span>
                      <span className="text-[var(--text-tertiary)]">
                        {source.count.toLocaleString()} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--glass-fill)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
              No search data yet
            </p>
          )}
        </div>
      </div>

      {/* Top queries */}
      <div className="mt-6 glass-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-[var(--accent)]" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Top Search Queries
          </h3>
        </div>
        {data?.topQueries && data.topQueries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--glass-border)]">
                  <th className="pb-2 text-left text-xs font-medium text-[var(--text-tertiary)]">
                    #
                  </th>
                  <th className="pb-2 text-left text-xs font-medium text-[var(--text-tertiary)]">
                    Query
                  </th>
                  <th className="pb-2 text-right text-xs font-medium text-[var(--text-tertiary)]">
                    Searches
                  </th>
                  <th className="pb-2 text-right text-xs font-medium text-[var(--text-tertiary)]">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.topQueries.map((q, i) => {
                  const total = data.totalSearches || 1;
                  const pct = ((q.count / total) * 100).toFixed(1);
                  return (
                    <tr
                      key={q.query}
                      className="border-b border-[var(--glass-border)]/50"
                    >
                      <td className="py-2.5 text-[var(--text-tertiary)]">
                        {i + 1}
                      </td>
                      <td className="py-2.5 font-medium text-[var(--text-primary)]">
                        {q.query}
                      </td>
                      <td className="py-2.5 text-right text-[var(--text-secondary)]">
                        {q.count}
                      </td>
                      <td className="py-2.5 text-right text-[var(--text-tertiary)]">
                        {pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-[var(--text-tertiary)]">
            No search queries recorded yet
          </p>
        )}
      </div>
    </div>
  );
}

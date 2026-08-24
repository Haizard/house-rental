"use client";

import { TrendingUp, TrendingDown, Minus, BarChart3, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

type TrendData = {
  area: string;
  propertyType: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  listingCount: number;
  trend: "up" | "down" | "stable";
  changePercent: number;
};

type TrendsResponse = {
  trends: TrendData[];
  summary: {
    avgPrice: number;
    totalListings: number;
    period: string;
  };
};

export function PriceTrendsContent() {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/analytics/price-trends")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setData(d.data);
        else setError(d.error || "Failed to load");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-surface flex min-h-40 items-center justify-center p-6 text-center">
        <p className="text-sm text-[var(--text-secondary)]">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const maxAvgPrice = Math.max(...data.trends.map((t) => t.avgPrice), 1);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="glass-surface p-4">
          <p className="text-xs text-[var(--text-tertiary)]">Average Rent</p>
          <p className="mt-1 text-2xl font-bold text-[var(--accent)]">
            TZS {data.summary.avgPrice.toLocaleString()}
          </p>
          <p className="text-[10px] text-[var(--text-tertiary)]">/month</p>
        </div>
        <div className="glass-surface p-4">
          <p className="text-xs text-[var(--text-tertiary)]">Active Listings</p>
          <p className="mt-1 text-2xl font-bold text-[var(--accent)]">
            {data.summary.totalListings}
          </p>
          <p className="text-[10px] text-[var(--text-tertiary)]">{data.summary.period}</p>
        </div>
        <div className="glass-surface p-4">
          <p className="text-xs text-[var(--text-tertiary)]">Areas Tracked</p>
          <p className="mt-1 text-2xl font-bold text-[var(--accent)]">
            {new Set(data.trends.map((t) => t.area)).size}
          </p>
          <p className="text-[10px] text-[var(--text-tertiary)]">neighborhoods</p>
        </div>
      </div>

      {/* Trend chart (horizontal bars) */}
      <div className="glass-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Average Rent by Area
          </h2>
        </div>

        <div className="space-y-3">
          {data.trends.slice(0, 12).map((trend) => {
            const barWidth = (trend.avgPrice / maxAvgPrice) * 100;
            return (
              <div key={`${trend.area}-${trend.propertyType}`}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {trend.area}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {trend.propertyType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--accent)]">
                      TZS {trend.avgPrice.toLocaleString()}
                    </span>
                    {trend.trend === "up" && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
                        <TrendingUp size={10} />+{trend.changePercent}%
                      </span>
                    )}
                    {trend.trend === "down" && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-500">
                        <TrendingDown size={10} />{trend.changePercent}%
                      </span>
                    )}
                    {trend.trend === "stable" && (
                      <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-tertiary)]">
                        <Minus size={10} />stable
                      </span>
                    )}
                  </div>
                </div>
                {/* Bar */}
                <div className="h-2 overflow-hidden rounded-full bg-[var(--glass-fill)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-purple-400 transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="mt-0.5 flex justify-between text-[9px] text-[var(--text-tertiary)]">
                  <span>Min: TZS {trend.minPrice.toLocaleString()}</span>
                  <span>{trend.listingCount} listings</span>
                  <span>Max: TZS {trend.maxPrice.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price insights */}
      <div className="glass-surface p-5">
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          💡 Price Insights
        </h2>
        <div className="space-y-2 text-sm text-[var(--text-secondary)]">
          {data.trends.length > 0 && (
            <>
              <p>
                📊 The cheapest area is{" "}
                <strong>
                  {data.trends.reduce((min, t) => t.avgPrice < min.avgPrice ? t : min, data.trends[0]).area}
                </strong>{" "}
                at TZS{" "}
                {Math.min(...data.trends.map((t) => t.avgPrice)).toLocaleString()}/mo.
              </p>
              <p>
                📈 The most expensive area is{" "}
                <strong>
                  {data.trends.reduce((max, t) => t.avgPrice > max.avgPrice ? t : max, data.trends[0]).area}
                </strong>{" "}
                at TZS{" "}
                {Math.max(...data.trends.map((t) => t.avgPrice)).toLocaleString()}/mo.
              </p>
            </>
          )}
          <p>
            💡 Prices shown are based on active listings from the last 30 days.
          </p>
        </div>
      </div>
    </div>
  );
}

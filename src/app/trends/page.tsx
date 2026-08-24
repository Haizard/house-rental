import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { PriceTrendsContent } from "@/components/analytics/price-trends-content";

export default async function TrendsPage() {
  return (
    <main className="min-h-screen px-4 pb-20 pt-10 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <Link className="button button-glass mb-6 px-4" href="/">
          <ArrowLeft size={18} aria-hidden="true" /> Home
        </Link>

        <header className="mb-8">
          <p className="eyebrow">Market Insights</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Price Trends
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Average rent by area and property type in Arusha.
          </p>
        </header>

        <PriceTrendsContent />
      </div>
    </main>
  );
}

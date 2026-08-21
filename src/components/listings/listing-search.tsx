"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Listing } from "@/lib/listings";
import { ListingCard } from "./listing-card";

const types = ["All homes", "Self-contained", "Private room", "One bedroom", "Single room"];
const priceRanges = ["Any budget", "Under 150k", "150k - 200k", "Over 200k"];

export function ListingSearch({ listings, initialArea = "" }: { listings: Listing[]; initialArea?: string }) {
  const [query, setQuery] = useState(initialArea);
  const [type, setType] = useState("All homes");
  const [priceRange, setPriceRange] = useState("Any budget");
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => listings.filter((listing) => {
    const matchesQuery = `${listing.title} ${listing.area} ${listing.type}`.toLowerCase().includes(query.toLowerCase().trim());
    const matchesType = type === "All homes" || listing.type === type;
    const matchesPrice = priceRange === "Any budget"
      || (priceRange === "Under 150k" && listing.price < 150000)
      || (priceRange === "150k - 200k" && listing.price >= 150000 && listing.price <= 200000)
      || (priceRange === "Over 200k" && listing.price > 200000);
    return matchesQuery && matchesType && matchesPrice;
  }), [listings, query, type, priceRange]);

  const hasActiveFilters = type !== "All homes" || priceRange !== "Any budget";

  return (
    <>
      {/* Search bar */}
      <div className="glass-search flex items-center gap-2 p-2">
        <Search className="ml-2 shrink-0 text-[var(--accent)]" size={20} aria-hidden="true" />
        <input
          className="min-h-10 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by area or home type"
          aria-label="Search listings"
        />
        {query && (
          <button
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)]"
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
        <button
          className={`flex size-9 shrink-0 items-center justify-center rounded-full transition ${
            showFilters || hasActiveFilters
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"
          }`}
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal size={17} aria-hidden="true" />
        </button>
      </div>

      {/* Filters — collapsible on mobile, always visible on desktop */}
      <div className={`mt-3 space-y-2 overflow-hidden transition-all duration-300 ${
        showFilters ? "max-h-40 opacity-100" : "max-h-0 opacity-0 lg:max-h-40 lg:opacity-100"
      }`}>
        {/* Type filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="Listing type filter">
          {types.map((item) => (
            <button
              className={`filter-chip shrink-0 ${type === item ? "filter-chip-active" : ""}`}
              type="button"
              key={item}
              onClick={() => setType(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Price filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="Listing price filter">
          {priceRanges.map((item) => (
            <button
              className={`filter-chip shrink-0 ${priceRange === item ? "filter-chip-active" : ""}`}
              type="button"
              key={item}
              onClick={() => setPriceRange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Active filters summary on mobile */}
      {hasActiveFilters && !showFilters && (
        <div className="mt-2 flex items-center gap-2 lg:hidden">
          <span className="text-xs text-[var(--text-secondary)]">Active:</span>
          {type !== "All homes" && (
            <button
              className="flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)]"
              onClick={() => setType("All homes")}
            >
              {type} <X size={10} />
            </button>
          )}
          {priceRange !== "Any budget" && (
            <button
              className="flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)]"
              onClick={() => setPriceRange("Any budget")}
            >
              {priceRange} <X size={10} />
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="mt-5 text-sm text-[var(--text-secondary)]">
        {results.length} {results.length === 1 ? "home" : "homes"} available
      </p>

      {/* Results grid */}
      {results.length > 0 ? (
        <div className="listing-grid mt-4">
          {results.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="glass-surface mt-4 flex min-h-56 flex-col items-center justify-center p-6 text-center">
          <Search className="mb-3 text-[var(--accent)]" size={28} aria-hidden="true" />
          <h2 className="text-lg font-semibold">No homes match those filters</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Try another area or type of home.</p>
          <button
            className="button button-glass mt-5 px-4"
            type="button"
            onClick={() => {
              setQuery("");
              setType("All homes");
              setPriceRange("Any budget");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}

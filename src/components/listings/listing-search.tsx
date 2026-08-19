"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Listing } from "@/lib/listings";
import { ListingCard } from "./listing-card";

const types = ["All homes", "Self-contained", "Private room", "One bedroom", "Single room"];

export function ListingSearch({ listings, initialArea = "" }: { listings: Listing[]; initialArea?: string }) {
  const [query, setQuery] = useState(initialArea);
  const [type, setType] = useState("All homes");
  const results = useMemo(() => listings.filter((listing) => {
    const matchesQuery = `${listing.title} ${listing.area} ${listing.type}`.toLowerCase().includes(query.toLowerCase().trim());
    return matchesQuery && (type === "All homes" || listing.type === type);
  }), [listings, query, type]);

  return <>
    <div className="glass-search flex items-center gap-3 p-2"><Search className="ml-2 text-[var(--accent)]" size={20} aria-hidden="true" /><input className="min-h-10 flex-1 bg-transparent text-[16px] outline-none placeholder:text-[var(--text-tertiary)]" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by area or home type" aria-label="Search listings" />{query && <button className="flex size-10 items-center justify-center rounded-full text-[var(--text-secondary)]" type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={18} aria-hidden="true" /></button>}</div>
    <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1" aria-label="Listing type filter"><SlidersHorizontal className="shrink-0 text-[var(--text-secondary)]" size={17} aria-hidden="true" />{types.map((item) => <button className={`filter-chip shrink-0 ${type === item ? "filter-chip-active" : ""}`} type="button" key={item} onClick={() => setType(item)}>{item}</button>)}</div>
    <p className="mt-7 text-sm text-[var(--text-secondary)]">{results.length} {results.length === 1 ? "home" : "homes"} available</p>
    {results.length > 0 ? <div className="listing-grid mt-4">{results.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div> : <div className="glass-surface mt-4 flex min-h-56 flex-col items-center justify-center p-6 text-center"><Search className="mb-3 text-[var(--accent)]" size={28} aria-hidden="true" /><h2 className="text-lg font-semibold">No homes match those filters</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Try another area or type of home.</p><button className="button button-glass mt-5 px-4" type="button" onClick={() => { setQuery(""); setType("All homes"); }}>Clear filters</button></div>}
  </>;
}

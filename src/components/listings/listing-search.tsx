"use client";

import { Bed, ChevronDown, ChevronUp, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState, createContext, useContext, type ReactNode } from "react";
import type { Listing } from "@/lib/listings";
import { ListingCard } from "./listing-card";
import { BottomSheet } from "@/components/ui/bottom-sheet";

const types = [
  "All homes",
  "Self-contained",
  "Private room",
  "One bedroom",
  "Single room",
  "Studio",
  "Apartment",
];
const priceRanges = [
  "Any budget",
  "Under 150k",
  "150k - 200k",
  "Over 200k",
];
const genderOptions = ["Any", "Male", "Female"];
const amenityFilters = [
  { slug: "wifi", label: "Wi-Fi" },
  { slug: "parking", label: "Parking" },
  { slug: "furnished", label: "Furnished" },
  { slug: "near-university", label: "Near university" },
  { slug: "water", label: "Water" },
  { slug: "electricity", label: "Electricity" },
];

type SearchContextType = {
  query: string;
  setQuery: (q: string) => void;
  results: Listing[];
  hasActiveFilters: boolean;
  activeFilterCount: number;
  type: string;
  setType: (t: string) => void;
  priceRange: string;
  setPriceRange: (p: string) => void;
  gender: string;
  setGender: (g: string) => void;
  furnishedOnly: boolean;
  setFurnishedOnly: (f: boolean) => void;
  selectedAmenities: string[];
  toggleAmenity: (slug: string) => void;
};

const SearchContext = createContext<SearchContextType | null>(null);

function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within SearchProvider");
  return ctx;
}

// --- Filter chips content shared between inline and bottom sheet ---
function FilterChips() {
  const { type, setType, priceRange, setPriceRange, gender, setGender, furnishedOnly, setFurnishedOnly, selectedAmenities, toggleAmenity } = useSearch();

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="Listing type filter">
        {types.map((item) => (
          <button className={`filter-chip shrink-0 inline-flex items-center justify-center ${type === item ? "filter-chip-active" : ""}`} type="button" key={item} onClick={() => setType(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="Listing price filter">
        {priceRanges.map((item) => (
          <button className={`filter-chip shrink-0 inline-flex items-center justify-center ${priceRange === item ? "filter-chip-active" : ""}`} type="button" key={item} onClick={() => setPriceRange(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-[var(--text-tertiary)]">Tenant:</span>
        {genderOptions.map((g) => (
          <button className={`filter-chip shrink-0 inline-flex items-center justify-center ${gender === g ? "filter-chip-active" : ""}`} type="button" key={g} onClick={() => setGender(g)}>
            {g}
          </button>
        ))}
        <button className={`filter-chip shrink-0 inline-flex items-center gap-1 ${furnishedOnly ? "filter-chip-active" : ""}`} type="button" onClick={() => setFurnishedOnly(!furnishedOnly)}>
          <Bed size={13} /> Furnished
        </button>
      </div>
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Amenities</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="Amenity filter">
          {amenityFilters.map(({ slug, label }) => (
            <button className={`filter-chip shrink-0 inline-flex items-center gap-1 ${selectedAmenities.includes(slug) ? "filter-chip-active" : ""}`} type="button" key={slug} onClick={() => toggleAmenity(slug)}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Active filter chips shown when filters are hidden ---
function ActiveFilterChips() {
  const { type, setType, priceRange, setPriceRange, gender, setGender, furnishedOnly, setFurnishedOnly, selectedAmenities, toggleAmenity, hasActiveFilters } = useSearch();

  if (!hasActiveFilters) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-[var(--text-secondary)]">Active:</span>
      {type !== "All homes" && (
        <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent)]" onClick={() => setType("All homes")}>
          {type} <X size={10} />
        </button>
      )}
      {priceRange !== "Any budget" && (
        <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent)]" onClick={() => setPriceRange("Any budget")}>
          {priceRange} <X size={10} />
        </button>
      )}
      {gender !== "Any" && (
        <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent)]" onClick={() => setGender("Any")}>
          {gender} <X size={10} />
        </button>
      )}
      {furnishedOnly && (
        <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent)]" onClick={() => setFurnishedOnly(false)}>
          Furnished <X size={10} />
        </button>
      )}
      {selectedAmenities.map((slug) => (
        <button className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent)]" key={slug} onClick={() => toggleAmenity(slug)}>
          {amenityFilters.find((a) => a.slug === slug)?.label ?? slug} <X size={10} />
        </button>
      ))}
    </div>
  );
}

// --- Search Bar ---
function ListingSearchBarInner() {
  const { query, setQuery, hasActiveFilters, activeFilterCount, results } = useSearch();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(false);

  return (
    <>
      <div className="glass-search flex items-center gap-2 p-2">
        <Search className="ml-2 shrink-0 text-[var(--accent)]" size={20} aria-hidden="true" />
        <input
          className="h-8 flex-1 bg-transparent font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by area or home type"
          aria-label="Search listings"
        />
        {query && (
          <button className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)]" type="button" onClick={() => setQuery("")} aria-label="Clear search">
            <X size={16} aria-hidden="true" />
          </button>
        )}
        <button
          className={`flex size-9 shrink-0 items-center justify-center rounded-full transition ${showMobileFilters || hasActiveFilters ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--accent-soft)]"}`}
          type="button"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal size={17} aria-hidden="true" />
        </button>
      </div>

      {/* Desktop: collapsible */}
      <div className="mt-3 hidden lg:block">
        <button className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition" type="button" onClick={() => setShowDesktopFilters(!showDesktopFilters)}>
          {showDesktopFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showDesktopFilters ? "Hide filters" : "Show filters"}
          {activeFilterCount > 0 && (
            <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">{activeFilterCount}</span>
          )}
        </button>
        {showDesktopFilters && <div className="mt-3 animate-slide-down"><FilterChips /></div>}
      </div>
      <div className="hidden lg:block"><ActiveFilterChips /></div>

      {/* Mobile: bottom sheet */}
      <BottomSheet open={showMobileFilters} onClose={() => setShowMobileFilters(false)} title="Filters">
        <FilterChips />
        <button className="button button-primary mt-4 w-full" type="button" onClick={() => setShowMobileFilters(false)}>
          Show {results.length} result{results.length !== 1 ? "s" : ""}
        </button>
      </BottomSheet>
      <div className="lg:hidden"><ActiveFilterChips /></div>
    </>
  );
}

// --- Results Grid ---
function ListingResultsInner() {
  const { results } = useSearch();

  return (
    <>
      <p className="mb-3 text-sm text-[var(--text-secondary)]">
        {results.length} {results.length === 1 ? "home" : "homes"} available
      </p>
      {results.length > 0 ? (
        <div className="listing-grid">
          {results.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="glass-surface flex min-h-56 flex-col items-center justify-center p-6 text-center">
          <Search className="mb-3 text-[var(--accent)]" size={28} aria-hidden="true" />
          <h2 className="text-lg font-semibold">No homes match those filters</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Try another area or type of home.</p>
        </div>
      )}
    </>
  );
}

// --- Public API: Provider that wraps bar + results ---
export function ListingSearchProvider({ listings, children }: { listings: Listing[]; children: ReactNode }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All homes");
  const [priceRange, setPriceRange] = useState("Any budget");
  const [gender, setGender] = useState("Any");
  const [furnishedOnly, setFurnishedOnly] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  function toggleAmenity(slug: string) {
    setSelectedAmenities((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  const results = useMemo(
    () =>
      listings.filter((listing) => {
        const matchesQuery =
          !query ||
          `${listing.title} ${listing.area} ${listing.type}`
            .toLowerCase()
            .includes(query.toLowerCase().trim());
        const matchesType = type === "All homes" || listing.type === type;
        const matchesPrice =
          priceRange === "Any budget" ||
          (priceRange === "Under 150k" && listing.price < 150000) ||
          (priceRange === "150k - 200k" && listing.price >= 150000 && listing.price <= 200000) ||
          (priceRange === "Over 200k" && listing.price > 200000);
        const matchesGender =
          gender === "Any" ||
          listing.genderPreference === "ANY" ||
          listing.genderPreference?.toLowerCase() === gender.toLowerCase();
        const matchesFurnished = !furnishedOnly || listing.furnished;
        const matchesAmenities =
          selectedAmenities.length === 0 ||
          selectedAmenities.every(
            (slug) =>
              slug === "furnished"
                ? listing.furnished
                : listing.amenities?.some((a) => a.slug === slug),
          );
        return matchesQuery && matchesType && matchesPrice && matchesGender && matchesFurnished && matchesAmenities;
      }),
    [listings, query, type, priceRange, gender, furnishedOnly, selectedAmenities],
  );

  const hasActiveFilters =
    type !== "All homes" || priceRange !== "Any budget" || gender !== "Any" || furnishedOnly || selectedAmenities.length > 0;

  const activeFilterCount =
    (type !== "All homes" ? 1 : 0) +
    (priceRange !== "Any budget" ? 1 : 0) +
    (gender !== "Any" ? 1 : 0) +
    (furnishedOnly ? 1 : 0) +
    selectedAmenities.length;

  const ctx: SearchContextType = {
    query, setQuery, results, hasActiveFilters, activeFilterCount,
    type, setType, priceRange, setPriceRange, gender, setGender,
    furnishedOnly, setFurnishedOnly, selectedAmenities, toggleAmenity,
  };

  return <SearchContext.Provider value={ctx}>{children}</SearchContext.Provider>;
}

// Named exports for split use (inside provider)
export function ListingSearchBar() {
  return <ListingSearchBarInner />;
}

export function ListingResults() {
  return <ListingResultsInner />;
}

// Standalone wrapper for /search page etc.
export function ListingSearch({ listings }: { listings: Listing[]; initialArea?: string }) {
  return (
    <ListingSearchProvider listings={listings}>
      <ListingSearchBar />
      <ListingResults />
    </ListingSearchProvider>
  );
}

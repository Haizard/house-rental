"use client";

import { Bed, Home, PawPrint, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Listing } from "@/lib/listings";
import { ListingCard } from "./listing-card";
import { BottomSheet } from "@/components/ui/bottom-sheet"

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

export function ListingSearch({
  listings,
  initialArea = "",
}: {
  listings: Listing[];
  initialArea?: string;
}) {
  const [query, setQuery] = useState(initialArea);
  const [type, setType] = useState("All homes");
  const [priceRange, setPriceRange] = useState("Any budget");
  const [gender, setGender] = useState("Any");
  const [furnishedOnly, setFurnishedOnly] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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
          (priceRange === "150k - 200k" &&
            listing.price >= 150000 &&
            listing.price <= 200000) ||
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
        return (
          matchesQuery &&
          matchesType &&
          matchesPrice &&
          matchesGender &&
          matchesFurnished &&
          matchesAmenities
        );
      }),
    [listings, query, type, priceRange, gender, furnishedOnly, selectedAmenities],
  );

  const hasActiveFilters =
    type !== "All homes" ||
    priceRange !== "Any budget" ||
    gender !== "Any" ||
    furnishedOnly ||
    selectedAmenities.length > 0;

  // Content shared between inline (desktop) and bottom sheet (mobile)
  const filterContent = (
    <div className="space-y-3">
      {/* Type filters */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        aria-label="Listing type filter"
      >
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
      <div
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
        aria-label="Listing price filter"
      >
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

      {/* Gender + Furnished row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-[var(--text-tertiary)]">
          Tenant:
        </span>
        {genderOptions.map((g) => (
          <button
            className={`filter-chip shrink-0 ${gender === g ? "filter-chip-active" : ""}`}
            type="button"
            key={g}
            onClick={() => setGender(g)}
          >
            {g}
          </button>
        ))}
        <button
          className={`filter-chip shrink-0 flex items-center gap-1 ${furnishedOnly ? "filter-chip-active" : ""}`}
          type="button"
          onClick={() => setFurnishedOnly(!furnishedOnly)}
        >
          <Bed size={13} /> Furnished
        </button>
      </div>

      {/* Amenity filters */}
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Amenities
        </p>
        <div
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide"
          aria-label="Amenity filter"
        >
          {amenityFilters.map(({ slug, label }) => (
            <button
              className={`filter-chip shrink-0 flex items-center gap-1 ${
                selectedAmenities.includes(slug) ? "filter-chip-active" : ""
              }`}
              type="button"
              key={slug}
              onClick={() => toggleAmenity(slug)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Search bar */}
      <div className="glass-search flex items-center gap-2 p-2">
        <Search
          className="ml-2 shrink-0 text-[var(--accent)]"
          size={20}
          aria-hidden="true"
        />
        <input
          className="h-8 flex-1 bg-transparent font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
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

      {/* Desktop: inline filters */}
      <div className="mt-3 hidden lg:block">
        {filterContent}
      </div>

      {/* Mobile: bottom sheet filters */}
      <BottomSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filters"
      >
        {filterContent}
        {/* Apply button at bottom */}
        <button
          className="button button-primary mt-4 w-full"
          type="button"
          onClick={() => setShowFilters(false)}
        >
          Show {results.length} result{results.length !== 1 ? "s" : ""}
        </button>
      </BottomSheet>

      {/* Active filters summary on mobile */}
      {hasActiveFilters && !showFilters && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 lg:hidden">
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
          {gender !== "Any" && (
            <button
              className="flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)]"
              onClick={() => setGender("Any")}
            >
              {gender} <X size={10} />
            </button>
          )}
          {furnishedOnly && (
            <button
              className="flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)]"
              onClick={() => setFurnishedOnly(false)}
            >
              Furnished <X size={10} />
            </button>
          )}
          {selectedAmenities.map((slug) => (
            <button
              className="flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)]"
              key={slug}
              onClick={() => toggleAmenity(slug)}
            >
              {amenityFilters.find((a) => a.slug === slug)?.label ?? slug}{" "}
              <X size={10} />
            </button>
          ))}
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
          <Search
            className="mb-3 text-[var(--accent)]"
            size={28}
            aria-hidden="true"
          />
          <h2 className="text-lg font-semibold">No homes match those filters</h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Try another area or type of home.
          </p>
          <button
            className="button button-glass mt-5 px-4"
            type="button"
            onClick={() => {
              setQuery("");
              setType("All homes");
              setPriceRange("Any budget");
              setGender("Any");
              setFurnishedOnly(false);
              setSelectedAmenities([]);
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}

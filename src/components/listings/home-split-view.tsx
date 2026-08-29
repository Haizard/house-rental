"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Listing } from "@/lib/listings";
import { ListingSearchProvider, ListingSearchBar, ListingResults } from "./listing-search";

const MapView = dynamic(() => import("@/components/map/map-view").then((m) => ({ default: m.MapView })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-fill)]">
      <div className="text-center text-sm text-[var(--text-tertiary)]">
        Loading map...
      </div>
    </div>
  ),
});

type HomeMapListing = {
  id: string;
  title: string;
  type: string;
  area: string;
  price: number;
  image: string;
  verified: boolean;
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
};

export function HomeSplitView({ listings }: { listings: Listing[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <ListingSearchProvider listings={listings}>
      {/* Search bar + filters — full width above the split */}
      <ListingSearchBar />

      {/* Split view: listing cards left, map right — same top */}
      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Left: scrollable listing cards */}
        <div className="min-w-0 flex-1 lg:max-w-[55%]">
          <ListingResults />
        </div>

        {/* Right: always-visible map with price badges */}
        <div className="hidden lg:block lg:w-[45%] lg:shrink-0 lg:sticky lg:top-4 lg:self-start" style={{ height: "calc(100vh - 80px)" }}>
          <div className="h-full overflow-hidden rounded-xl border border-[var(--glass-border)]">
            <MapView
              listings={listings as HomeMapListing[]}
              selectedId={selectedId}
              onSelectListing={(listing) => setSelectedId(listing?.id ?? null)}
            />
          </div>
        </div>
      </div>
    </ListingSearchProvider>
  );
}

"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ListingSearch } from "@/components/listings/listing-search";

const MapView = dynamic(() => import("./map-view").then((m) => ({ default: m.MapView })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-fill)]">
      <div className="text-center text-sm text-[var(--text-tertiary)]">
        Loading map...
      </div>
    </div>
  ),
});

type SearchListing = {
  id: string;
  title: string;
  type: string;
  area: string;
  price: number;
  image: string;
  verified: boolean;
  agentId: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
};

export function SearchMapToggle({ listings }: { listings: SearchListing[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6" style={{ minHeight: "calc(100vh - 200px)" }}>
      {/* Left side: scrollable listings */}
      <div className="flex-1 min-w-0 overflow-y-auto lg:max-h-[calc(100vh-120px)]">
        <ListingSearch
          listings={listings}
          initialArea=""
          selectedListingId={selectedId}
          onSelectListing={setSelectedId}
        />
      </div>

      {/* Right side: always-visible map */}
      <div className="hidden lg:block lg:w-[420px] lg:shrink-0 lg:sticky lg:top-4 lg:self-start" style={{ height: "calc(100vh - 120px)" }}>
        <div className="h-full overflow-hidden rounded-xl border border-[var(--glass-border)]">
          <MapView
            listings={listings}
            selectedId={selectedId}
            onSelectListing={(listing) => setSelectedId(listing?.id ?? null)}
          />
        </div>
      </div>
    </div>
  );
}

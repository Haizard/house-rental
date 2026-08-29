"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ListingCard } from "./listing-card";
import type { Listing } from "@/lib/listings";

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
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      {/* Left side: scrollable listing cards — 3 per row on desktop */}
      <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-3 gap-3">
        {listings.map((listing) => (
          <div
            key={listing.id}
            onClick={() => setSelectedId(listing.id)}
            className={`cursor-pointer transition-all duration-200 ${
              selectedId === listing.id ? "ring-2 ring-[var(--accent)] rounded-xl" : ""
            }`}
          >
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>

      {/* Right side: always-visible map with price badges */}
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
  );
}

"use client";

import { useState } from "react";
import { Map, LayoutGrid } from "lucide-react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./map-view").then((m) => ({ default: m.MapView })), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] w-full items-center justify-center rounded-xl border border-[var(--glass-border)] bg-[var(--glass-fill)] sm:h-[500px]">
      <div className="text-center text-sm text-[var(--text-tertiary)]">
        <div className="mb-2 text-2xl">🗺️</div>
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
  const [view, setView] = useState<"map" | "list">("map");

  return (
    <div className="mb-5">
      {/* Toggle buttons */}
      <div className="glass-surface mb-4 flex items-center gap-1 p-1">
        <button
          onClick={() => setView("map")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            view === "map"
              ? "bg-[var(--accent)] text-white shadow-md"
              : "text-[var(--text-secondary)] hover:bg-white/10"
          }`}
        >
          <Map size={16} aria-hidden="true" />
          Map
        </button>
        <button
          onClick={() => setView("list")}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
            view === "list"
              ? "bg-[var(--accent)] text-white shadow-md"
              : "text-[var(--text-secondary)] hover:bg-white/10"
          }`}
        >
          <LayoutGrid size={16} aria-hidden="true" />
          List
        </button>
      </div>

      {/* Map view */}
      {view === "map" && (
        <div className="animate-fade-in">
          <MapView listings={listings} />
        </div>
      )}

      {/* List view is handled by ListingSearch below */}
      {view === "list" && (
        <div id="listings" className="animate-fade-in">
          {/* List content rendered by ListingSearch */}
        </div>
      )}
    </div>
  );
}

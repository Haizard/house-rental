"use client";

import { useState } from "react";
import { Layers, Grip, Heart, X } from "lucide-react";
import type { Listing } from "@/lib/listings";
import { ListingCard } from "./listing-card";
import { SwipeableListingStack } from "./swipeable-card";

export function SwipeToggle({ listings }: { listings: Listing[] }) {
  const [mode, setMode] = useState<"grid" | "swipe">("grid");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  function handleSwipeAction(action: "save" | "dismiss" | "details", listingId: string) {
    if (action === "save") {
      setSavedIds((prev) => new Set([...prev, listingId]));
      // Also save via API
      fetch(`/api/listings/${listingId}/save`, { method: "POST" }).catch(() => {});
    } else if (action === "dismiss") {
      setDismissedIds((prev) => new Set([...prev, listingId]));
    }
  }

  const visibleListings = listings.filter((l) => !dismissedIds.has(l.id));

  return (
    <div>
      {/* Toggle button — mobile only */}
      <div className="mb-4 flex items-center gap-2 sm:hidden">
        <button
          onClick={() => setMode("grid")}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            mode === "grid"
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--glass-fill)] text-[var(--text-secondary)]"
          }`}
        >
          <Grip size={14} /> Grid
        </button>
        <button
          onClick={() => setMode("swipe")}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            mode === "swipe"
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--glass-fill)] text-[var(--text-secondary)]"
          }`}
        >
          <Layers size={14} /> Swipe
        </button>
        {savedIds.size > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs text-[#FBC618]">
            <Heart size={12} fill="currentColor" /> {savedIds.size}
          </span>
        )}
        {dismissedIds.size > 0 && (
          <span className="flex items-center gap-1 text-xs text-red-400">
            <X size={12} /> {dismissedIds.size}
          </span>
        )}
      </div>

      {/* Grid mode */}
      {mode === "grid" && (
        <div className="listing-grid">
          {visibleListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} saved={savedIds.has(listing.id)} />
          ))}
        </div>
      )}

      {/* Swipe mode — mobile only */}
      {mode === "swipe" && (
        <div className="py-4 sm:hidden">
          <SwipeableListingStack
            listings={visibleListings}
            onAction={handleSwipeAction}
          />
        </div>
      )}
    </div>
  );
}

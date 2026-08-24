"use client";

import { Search, X, Trash2 } from "lucide-react";
import { useState } from "react";

type SavedSearch = {
  id: string;
  name: string | null;
  area: string | null;
  propertyType: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  gender: string | null;
  furnished: boolean | null;
  amenities: string[];
  createdAt: string | Date;
};

interface SavedSearchCardProps {
  search: SavedSearch;
  matchCount?: number;
  onDelete: (id: string) => void;
}

export function SavedSearchCard({ search, matchCount = 0, onDelete }: SavedSearchCardProps) {
  const [deleting, setDeleting] = useState(false);

  const parts = [
    search.area,
    search.propertyType,
    search.minPrice ? `TZS ${search.minPrice.toLocaleString()}+` : null,
    search.maxPrice ? `up to TZS ${search.maxPrice.toLocaleString()}` : null,
    search.gender && search.gender !== "Any" ? search.gender : null,
    search.furnished ? "Furnished" : null,
    ...search.amenities,
  ].filter(Boolean);

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch("/api/student/saved-searches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchId: search.id }),
      });
      onDelete(search.id);
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className="glass-surface flex items-center gap-4 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)]">
        <Search size={18} className="text-[var(--accent)]" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {search.name || parts.join(" · ") || "All listings"}
        </h3>
        <div className="mt-1 flex flex-wrap gap-1">
          {parts.slice(0, 4).map((part, i) => (
            <span
              className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]"
              key={i}
            >
              {part}
            </span>
          ))}
          {parts.length > 4 && (
            <span className="text-[10px] text-[var(--text-tertiary)]">
              +{parts.length - 4} more
            </span>
          )}
        </div>
        {matchCount > 0 && (
          <p className="mt-1 text-[11px] font-medium text-emerald-600">
            {matchCount} new match{matchCount !== 1 ? "es" : ""}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)] transition-colors hover:bg-red-50 hover:text-red-500"
        aria-label="Delete saved search"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}

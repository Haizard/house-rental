"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { SavedSearchCard } from "./saved-search-card";
import { EmptyState } from "@/components/ui/empty-state";

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
  matchCount: number;
};

interface SavedSearchesListProps {
  initialSearches: SavedSearch[];
}

export function SavedSearchesList({ initialSearches }: SavedSearchesListProps) {
  const [searches, setSearches] = useState(initialSearches);

  function handleDelete(id: string) {
    setSearches((prev) => prev.filter((s) => s.id !== id));
  }

  if (searches.length === 0) {
    return (
      <EmptyState
        variant="search"
        title="No saved searches"
        description="Save a search from the listings page to get alerts when new rooms match your criteria."
      />
    );
  }

  return (
    <div className="space-y-3">
      {searches.map((search) => (
        <SavedSearchCard
          key={search.id}
          search={search}
          matchCount={search.matchCount}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}

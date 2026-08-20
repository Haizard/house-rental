"use client";

import { Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AISearchBar({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setError(result?.error ?? "Search failed.");
        setLoading(false);
        return;
      }

      // Build search URL with extracted filters
      const params = new URLSearchParams();
      if (result.filters?.area) params.set("area", result.filters.area);
      if (result.filters?.propertyType) params.set("type", result.filters.propertyType);
      if (result.filters?.minPrice) params.set("minPrice", String(result.filters.minPrice));
      if (result.filters?.maxPrice) params.set("maxPrice", String(result.filters.maxPrice));

      router.push(`/search?${params.toString()}`);
    } catch {
      setError("Search is temporarily unavailable.");
      setLoading(false);
    }
  }

  return (
    <div className={className}>
      <form className="glass-search flex flex-col gap-2 p-2 sm:flex-row" onSubmit={handleSubmit}>
        <label className="flex min-h-11 flex-1 items-center gap-3 px-3">
          <Sparkles className="text-[var(--accent)]" size={20} aria-hidden="true" />
          <span className="sr-only">AI search</span>
          <input
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try: "Njiro karibu na chuo, 150k, self-contained"'
            disabled={loading}
          />
        </label>
        <button
          className="button button-primary px-5"
          type="submit"
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Searching...
            </span>
          ) : (
            <>
              <Search size={18} aria-hidden="true" /> AI Search
            </>
          )}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <p className="mt-2 text-xs text-[var(--text-tertiary)]">
        Type in Swahili or English — the AI will find matching homes.
      </p>
    </div>
  );
}

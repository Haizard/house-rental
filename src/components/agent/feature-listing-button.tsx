"use client";

import { Star, Loader2 } from "lucide-react";
import { useState } from "react";

interface FeatureListingButtonProps {
  listingId: string;
  isFeatured: boolean;
  featuredUntil?: string | null;
}

export function FeatureListingButton({
  listingId,
  isFeatured: initialFeatured,
  featuredUntil,
}: FeatureListingButtonProps) {
  const [featured, setFeatured] = useState(initialFeatured);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setPending(true);
    setError("");
    try {
      const res = await fetch(`/api/agent/listings/${listingId}/feature`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setFeatured(data.isFeatured);
      } else {
        setError(data.error || "Failed to update");
      }
    } catch {
      setError("Network error");
    }
    setPending(false);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
          featured
            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
            : "bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)]/20"
        }`}
      >
        {pending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Star size={12} fill={featured ? "currentColor" : "none"} />
        )}
        {featured ? "Featured" : "Feature"}
      </button>
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  );
}

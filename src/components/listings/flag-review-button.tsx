"use client";

import { Flag, Loader2 } from "lucide-react";
import { useState } from "react";

interface FlagReviewButtonProps {
  reviewId: string;
}

export function FlagReviewButton({ reviewId }: FlagReviewButtonProps) {
  const [busy, setBusy] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [error, setError] = useState("");

  async function handleFlag() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/reviews/${reviewId}/flag`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setFlagged(true);
      } else {
        setError(data.error || "Failed to flag review");
      }
    } catch {
      setError("Network error");
    }
    setBusy(false);
  }

  if (flagged) {
    return (
      <span className="text-[10px] text-[var(--text-tertiary)]">
        ✓ Reported
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleFlag}
      disabled={busy}
      className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)] transition-colors hover:text-red-500"
    >
      {busy ? (
        <Loader2 size={10} className="animate-spin" />
      ) : (
        <Flag size={10} />
      )}
      Report
      {error && <span className="ml-1 text-red-500">{error}</span>}
    </button>
  );
}

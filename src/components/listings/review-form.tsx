"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import { haptic } from "@/lib/ui/haptics";

export function ReviewForm({
  agentId,
  listingId,
}: {
  agentId: string;
  listingId?: string;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (rating === 0) return;
    setBusy(true);
    setStatus("");

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId, listingId, rating, comment }),
    });

    const result = await res.json().catch(() => null);
    if (res.ok) {
      setSubmitted(true);
      haptic("success");
    } else {
      setStatus(result?.error ?? "Unable to submit review.");
    }
    setBusy(false);
  }

  if (submitted) {
    return (
      <div className="glass-surface p-4 text-center">
        <p className="text-sm font-medium text-[var(--success)]">
          Thank you for your review!
        </p>
      </div>
    );
  }

  return (
    <div className="glass-surface space-y-3 p-4">
      <p className="text-sm font-medium">Rate this agent</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            className="p-0.5"
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            type="button"
          >
            <Star
              size={24}
              className={
                star <= (hovered || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-[var(--text-tertiary)]"
              }
            />
          </button>
        ))}
      </div>
      <textarea
        className="glass-search min-h-16 w-full resize-y px-3 py-2 text-sm outline-none placeholder:text-[var(--text-tertiary)]"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience (optional)"
        maxLength={1000}
      />
      {status && (
        <p className="text-xs text-red-600" role="alert">{status}</p>
      )}
      <button
        className="button button-primary w-full px-4 text-sm"
        disabled={busy || rating === 0}
        type="button"
        onClick={submit}
      >
        {busy ? "Submitting..." : "Submit review"}
      </button>
    </div>
  );
}

"use client";

import { Flag, Loader2 } from "lucide-react";
import { useState } from "react";

const REPORT_CATEGORIES = [
  { value: "FAKE_LISTING", label: "Fake listing" },
  { value: "WRONG_PRICE", label: "Wrong price" },
  { value: "UNRESPONSIVE", label: "Unresponsive agent" },
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "DUPLICATE", label: "Duplicate listing" },
  { value: "OTHER", label: "Other" },
];

interface ReportListingButtonProps {
  listingId: string;
}

export function ReportListingButton({ listingId }: ReportListingButtonProps) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!category) return;
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "LISTING",
          targetId: listingId,
          reason: category,
          description: description || undefined,
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to submit report");
      }
    } catch {
      setError("Network error");
    }
    setBusy(false);
  }

  if (submitted) {
    return (
      <p className="text-xs text-emerald-600 font-medium">
        Report submitted. Thank you for helping keep the platform safe.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-red-500 transition-colors"
      >
        <Flag size={12} />
        Report listing
      </button>
    );
  }

  return (
    <div className="glass-surface space-y-3 p-4 animate-scale-in">
      <h4 className="text-sm font-semibold">Report this listing</h4>

      <div className="flex flex-wrap gap-1.5">
        {REPORT_CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`filter-chip shrink-0 text-[11px] ${
              category === cat.value ? "filter-chip-active" : ""
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <textarea
        className="glass-search min-h-16 w-full resize-y px-3 py-2 text-sm outline-none"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Add details (optional)"
        maxLength={500}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy || !category}
          className="button button-primary min-h-9 flex-1 px-3 text-xs"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : "Submit report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="button button-glass min-h-9 px-3 text-xs"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

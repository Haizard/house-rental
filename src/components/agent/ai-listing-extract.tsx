"use client";

import { Sparkles, WandSparkles } from "lucide-react";
import { useState } from "react";

type ExtractedData = {
  title: string;
  area: string;
  address?: string;
  rentAmount: number;
  propertyType: string;
  description?: string;
  selfContained?: boolean;
  waterAvailable?: boolean;
  electricityAvailable?: boolean;
  internetAvailable?: boolean;
  availableMonth?: number;
  confidence: "high" | "medium" | "low";
  clarificationNeeded?: string[];
};

export function AIListingExtract({
  onExtracted,
}: {
  onExtracted: (data: ExtractedData) => void;
}) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleExtract() {
    if (!description.trim()) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/extract-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error ?? "Extraction failed.");
        setLoading(false);
        return;
      }

      onExtracted(result.data);
      setLoading(false);
    } catch {
      setError("AI extraction is temporarily unavailable.");
      setLoading(false);
    }
  }

  return (
    <div className="glass-surface space-y-4 p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-[var(--accent)]" aria-hidden="true" />
        <h3 className="font-semibold">AI-assisted listing</h3>
      </div>
      <p className="text-sm text-[var(--text-secondary)]">
        Paste your listing description in Swahili or English and the AI will fill
        in the form for you.
      </p>
      <textarea
        className="glass-search min-h-28 w-full resize-y px-4 py-3 text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder='e.g. "Nina chumba kimoja Njiro karibu na chuo, 150k, self, maji yapo, available mwezi wa 9"'
        maxLength={2000}
      />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <button
        className="button button-primary w-full px-5"
        disabled={loading || !description.trim()}
        type="button"
        onClick={handleExtract}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Extracting...
          </span>
        ) : (
          <>
            <WandSparkles size={18} aria-hidden="true" /> Extract with AI
          </>
        )}
      </button>
    </div>
  );
}

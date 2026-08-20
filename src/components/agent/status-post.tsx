"use client";

import { Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const statusTypes = [
  { value: "AVAILABLE", label: "🟢 Available now" },
  { value: "NEW_ROOM", label: "🏠 New room" },
  { value: "PRICE_DROP", label: "📉 Price drop" },
  { value: "URGENT", label: "🔥 Urgent" },
  { value: "GENERAL", label: "📢 General update" },
] as const;

export function StatusPost({
  dailyUsed,
  dailyLimit,
  tier,
}: {
  dailyUsed: number;
  dailyLimit: number;
  tier: string;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [type, setType] = useState<string>("GENERAL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAI, setShowAI] = useState(false);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch("/api/agent/statuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, type }),
    });

    const result = await res.json().catch(() => null);
    if (!res.ok) {
      setError(result?.error ?? "Unable to post status.");
    } else {
      setSuccess("Status posted! Visible for 24 hours.");
      setContent("");
      setType("GENERAL");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleAIExtract() {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setError("");

    try {
      const res = await fetch("/api/ai/extract-listing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiText }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) {
        setError(result?.error ?? "AI extraction failed.");
      } else {
        const d = result.data;
        const parts = [d.title, d.area, `${d.propertyType}`, `TZS ${d.rentAmount?.toLocaleString()}/mo`].filter(Boolean);
        setContent(parts.join(" · "));
        setShowAI(false);
      }
    } catch {
      setError("AI extraction unavailable.");
    }
    setAiLoading(false);
  }

  const remaining = Math.max(0, dailyLimit - dailyUsed);
  const isFree = tier === "FREE";

  return (
    <div className="glass-surface space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Post a status</h3>
        {isFree && (
          <span className="text-xs text-[var(--text-secondary)]">
            {remaining}/{dailyLimit} remaining today
          </span>
        )}
      </div>

      <form className="space-y-3" onSubmit={handleSubmit}>
        <select
          className="glass-search w-full px-4 py-3 text-[15px] outline-none"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {statusTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <textarea
          className="glass-search min-h-24 w-full resize-y px-4 py-3 text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder='e.g. "Chumba Njiro 150k self, maji yapo, karibu na chuo"'
          maxLength={1000}
          disabled={remaining === 0 && isFree}
        />

        {/* AI extraction toggle */}
        <button
          className="flex items-center gap-2 text-xs font-medium text-[var(--accent)]"
          type="button"
          onClick={() => setShowAI(!showAI)}
        >
          <Sparkles size={14} aria-hidden="true" />
          {showAI ? "Hide AI helper" : "Use AI to fill details"}
        </button>

        {showAI && (
          <div className="glass-surface space-y-2 p-3">
            <p className="text-xs text-[var(--text-secondary)]">
              Paste your listing description and AI will extract the details.
            </p>
            <textarea
              className="glass-search min-h-16 w-full resize-y px-3 py-2 text-sm outline-none placeholder:text-[var(--text-tertiary)]"
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
              placeholder='e.g. "Nina chumba kimoja Njiro 150k self, maji yapo"'
              maxLength={2000}
            />
            <button
              className="button button-glass w-full px-3 text-xs"
              disabled={aiLoading || !aiText.trim()}
              type="button"
              onClick={handleAIExtract}
            >
              {aiLoading ? "Extracting..." : "Extract with AI"}
            </button>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600" role="alert">{error}</p>
        )}
        {success && (
          <p className="text-sm text-[var(--success)]" role="status">{success}</p>
        )}

        <button
          className="button button-primary w-full px-5"
          disabled={loading || !content.trim() || (remaining === 0 && isFree)}
          type="submit"
        >
          {loading ? "Posting..." : "Post status"}
        </button>
      </form>

      {isFree && remaining === 0 && (
        <div className="flex items-center gap-2 rounded-[14px] bg-[var(--accent-soft)] p-3 text-xs text-[var(--accent)]">
          <Zap size={14} aria-hidden="true" />
          <span>Daily limit reached. Upgrade to Pro for unlimited statuses.</span>
        </div>
      )}
    </div>
  );
}

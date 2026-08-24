"use client";

import { Languages, Loader2 } from "lucide-react";
import { useState } from "react";

interface TranslatedTextProps {
  text: string;
  className?: string;
}

/**
 * Displays text with a translate button.
 * Detects language and offers translation to the other language.
 */
export function TranslatedText({ text, className = "" }: TranslatedTextProps) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sourceLang, setSourceLang] = useState<string | null>(null);

  // Simple language detection
  const swahiliWords = ["na", "ya", "kwa", "ni", "kuna", "chumba", "nyumba", "jumba", "maji", "umeme", "laki", "karibu", "self", "monthly"];
  const words = text.toLowerCase().split(/\s+/);
  const swahiliCount = words.filter((w) => swahiliWords.includes(w)).length;
  const detectedLang = swahiliCount >= 2 ? "sw" : "en";
  const targetLang = detectedLang === "en" ? "sw" : "en";
  const targetLabel = targetLang === "en" ? "English" : "Swahili";

  async function handleTranslate() {
    if (translated) {
      // Toggle back to original
      setTranslated(null);
      setSourceLang(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang }),
      });
      const data = await res.json();
      if (res.ok && data.data?.translated) {
        setTranslated(data.data.translated);
        setSourceLang(data.data.sourceLang);
      }
    } catch {
      // Ignore
    }
    setLoading(false);
  }

  return (
    <div className={className}>
      <p className="whitespace-pre-wrap text-[15px] leading-6 text-[var(--text-primary)]">
        {translated ?? text}
      </p>
      <button
        type="button"
        onClick={handleTranslate}
        disabled={loading}
        className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-pressed)]"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Languages size={12} />
        )}
        {translated ? "Show original" : `Translate to ${targetLabel}`}
      </button>
    </div>
  );
}

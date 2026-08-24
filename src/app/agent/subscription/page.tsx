"use client";

import { Check, CreditCard, Loader2, ExternalLink, Star } from "lucide-react";
import { useState, useEffect } from "react";

export default function AgentSubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "canceled">("idle");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") setStatus("success");
    if (params.get("canceled") === "true") setStatus("canceled");
  }, []);

  async function handleCheckout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName: "PRO" }),
      });
      const data = await res.json();
      if (res.ok && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        setError(data.error || "Failed to start checkout");
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-2xl pb-20 pt-10">
      <header className="mb-8">
        <p className="eyebrow">Agent workspace</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Subscription</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Upgrade to Pro for unlimited leads and no ads.
        </p>
      </header>

      {/* Success/Cancel messages */}
      {status === "success" && (
        <div className="glass-surface mb-6 border-emerald-200 bg-emerald-50 p-4 text-center animate-slide-up">
          <p className="text-sm font-semibold text-emerald-700">
            🎉 Payment successful! Your Pro subscription is now active.
          </p>
        </div>
      )}
      {status === "canceled" && (
        <div className="glass-surface mb-6 border-amber-200 bg-amber-50 p-4 text-center animate-slide-up">
          <p className="text-sm font-medium text-amber-700">
            Payment canceled. You can try again anytime.
          </p>
        </div>
      )}

      {/* Plans */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Free Plan */}
        <div className="glass-surface p-6">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Free</h2>
          <p className="mt-1 text-3xl font-bold text-[var(--text-primary)]">
            TZS 0<span className="text-sm font-normal text-[var(--text-tertiary)]">/mo</span>
          </p>
          <ul className="mt-4 space-y-2.5">
            <Feature text="5 active listings" />
            <Feature text="10 leads per month" />
            <Feature text="3 statuses per day" />
            <Feature text="Platform ads displayed" />
          </ul>
          <div className="mt-6">
            <span className="button button-glass w-full">Current plan</span>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="glass-surface relative overflow-hidden border-[var(--accent)]/30 p-6">
          <div className="absolute right-3 top-3">
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[var(--accent)] to-purple-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
              <Star size={10} fill="currentColor" /> PRO
            </span>
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Pro</h2>
          <p className="mt-1 text-3xl font-bold text-[var(--accent)]">
            TZS 20,000<span className="text-sm font-normal text-[var(--text-tertiary)]">/mo</span>
          </p>
          <ul className="mt-4 space-y-2.5">
            <Feature text="Unlimited listings" highlighted />
            <Feature text="Unlimited leads" highlighted />
            <Feature text="Unlimited statuses" highlighted />
            <Feature text="No platform ads" highlighted />
            <Feature text="Room request access" highlighted />
            <Feature text="Priority support" highlighted />
          </ul>
          <div className="mt-6">
            <button
              className="button button-primary w-full"
              disabled={loading}
              onClick={handleCheckout}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <CreditCard size={16} aria-hidden="true" />
                  Upgrade to Pro
                </>
              )}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-center text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="glass-surface mt-8 p-6">
        <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
          Frequently Asked Questions
        </h3>
        <div className="space-y-4 text-sm text-[var(--text-secondary)]">
          <div>
            <p className="font-medium text-[var(--text-primary)]">Can I cancel anytime?</p>
            <p className="mt-1">Yes. Your subscription remains active until the end of the billing period.</p>
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">What happens when I downgrade?</p>
            <p className="mt-1">You keep Pro features until your subscription expires, then revert to Free plan limits.</p>
          </div>
          <div>
            <p className="font-medium text-[var(--text-primary)]">Do you accept mobile money?</p>
            <p className="mt-1">Currently we accept card payments via Stripe. Mobile money support coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text, highlighted = false }: { text: string; highlighted?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <Check
        size={16}
        className={`mt-0.5 shrink-0 ${highlighted ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"}`}
        aria-hidden="true"
      />
      <span className={highlighted ? "font-medium text-[var(--text-primary)]" : ""}>
        {text}
      </span>
    </li>
  );
}

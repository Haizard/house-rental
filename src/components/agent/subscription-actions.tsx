"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SubscriptionActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleCancel() {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/subscription", { method: "PATCH" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  return (
    <div className="glass-surface p-5">
      <h3 className="font-bold text-[var(--text-primary)]">Cancel subscription</h3>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Your Pro features will remain active until the current billing period ends.
      </p>

      {!showConfirm ? (
        <button
          className="button mt-4 border border-red-300 px-4 text-sm text-red-600 hover:bg-red-50"
          onClick={() => setShowConfirm(true)}
        >
          Cancel subscription
        </button>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <button
            className="button border border-red-300 px-4 text-sm text-red-600 hover:bg-red-50"
            disabled={loading}
            onClick={handleCancel}
          >
            {loading ? "Cancelling…" : "Yes, cancel"}
          </button>
          <button
            className="button button-glass px-4 text-sm"
            onClick={() => setShowConfirm(false)}
          >
            Keep subscription
          </button>
        </div>
      )}
    </div>
  );
}

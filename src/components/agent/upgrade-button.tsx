"use client";

import { Zap } from "lucide-react";
import { useState, useTransition } from "react";

export function UpgradeButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleUpgrade() {
    startTransition(async () => {
      const res = await fetch("/api/agent/upgrade", { method: "POST" });
      const result = await res.json().catch(() => null);
      if (res.ok) {
        setMessage("Upgrade requested! Payment integration coming soon.");
      } else {
        setMessage(result?.error ?? "Upgrade not available yet.");
      }
    });
  }

  if (message) {
    return (
      <p className="text-sm text-[var(--accent)]" role="status">
        {message}
      </p>
    );
  }

  return (
    <button
      className="button button-primary w-full"
      disabled={pending}
      type="button"
      onClick={handleUpgrade}
    >
      {pending ? (
        "Processing..."
      ) : (
        <>
          <Zap size={18} aria-hidden="true" /> Upgrade to Pro
        </>
      )}
    </button>
  );
}

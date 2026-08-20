"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const nextStatus: Record<string, string> = {
  NEW: "CONTACTED",
  CONTACTED: "VIEWING_REQUESTED",
  VIEWING_REQUESTED: "NEGOTIATING",
  NEGOTIATING: "RENTED",
};

const nextLabel: Record<string, string> = {
  NEW: "Mark contacted",
  CONTACTED: "Request viewing",
  VIEWING_REQUESTED: "Start negotiating",
  NEGOTIATING: "Mark rented",
};

export function LeadActions({
  leadId,
  currentStatus,
}: {
  leadId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = nextStatus[currentStatus];
  const label = nextLabel[currentStatus];

  if (!next || !label) return null;

  function advance() {
    startTransition(async () => {
      await fetch(`/api/agent/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    });
  }

  return (
    <button
      className="button button-primary min-h-8 flex-1 px-2 text-[11px]"
      disabled={pending}
      type="button"
      onClick={advance}
    >
      {label}
    </button>
  );
}

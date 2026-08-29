"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function AgentActions({
  agentId,
  userId,
  isActive,
}: {
  agentId: string;
  userId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      router.refresh();
    });
  }

  return (
    <button
      className={`button h-8 px-3 text-sm ${isActive ? "button-glass" : "button-primary"}`}
      disabled={pending}
      type="button"
      onClick={toggleActive}
    >
      {isActive ? "Suspend" : "Restore"}
    </button>
  );
}

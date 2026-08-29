"use client";

import { UserX, UserCheck, Loader2 } from "lucide-react";
import { useState } from "react";
import { haptic } from "@/lib/ui/haptics";

interface BlockAgentButtonProps {
  agentId: string;
  isBlocked: boolean;
  onToggle?: (blocked: boolean) => void;
}

export function BlockAgentButton({ agentId, isBlocked: initialBlocked, onToggle }: BlockAgentButtonProps) {
  const [blocked, setBlocked] = useState(initialBlocked);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      const method = blocked ? "DELETE" : "POST";
      const body = blocked
        ? JSON.stringify({ agentId })
        : JSON.stringify({ agentId });

      const res = await fetch("/api/student/blocked-agents", {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        setBlocked(!blocked);
        haptic(blocked ? "light" : "success");
        onToggle?.(!blocked);
      }
    } catch {
      // Ignore
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all ${
        blocked
          ? "bg-red-50 text-red-600 hover:bg-red-100"
          : "bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)]/20"
      }`}
    >
      {busy ? (
        <Loader2 size={12} className="animate-spin" />
      ) : blocked ? (
        <UserCheck size={12} />
      ) : (
        <UserX size={12} />
      )}
      {blocked ? "Unblock" : "Block agent"}
    </button>
  );
}

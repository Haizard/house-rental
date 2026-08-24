"use client";

import { Clock, Wifi } from "lucide-react";

interface AgentStatusBadgeProps {
  lastActiveAt?: string | Date | null;
  avgResponseMinutes?: number | null;
  className?: string;
}

/**
 * Shows agent online status (green dot) and average response time.
 * Online = active within last 5 minutes.
 */
export function AgentStatusBadge({
  lastActiveAt,
  avgResponseMinutes,
  className = "",
}: AgentStatusBadgeProps) {
  const isOnline = lastActiveAt
    ? Date.now() - new Date(lastActiveAt).getTime() < 5 * 60 * 1000
    : false;

  const responseText = avgResponseMinutes != null
    ? avgResponseMinutes < 60
      ? `Responds in ~${avgResponseMinutes}min`
      : avgResponseMinutes < 1440
        ? `Responds in ~${Math.round(avgResponseMinutes / 60)}h`
        : `Responds in ~${Math.round(avgResponseMinutes / 1440)}d`
    : null;

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {/* Online indicator */}
      <span className="flex items-center gap-1">
        <span
          className={`size-2 rounded-full ${
            isOnline
              ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
              : "bg-[var(--text-tertiary)]"
          }`}
        />
        <span className={isOnline ? "text-emerald-600 font-medium" : "text-[var(--text-tertiary)]"}>
          {isOnline ? "Online" : "Offline"}
        </span>
      </span>

      {/* Response time */}
      {responseText && (
        <>
          <span className="text-[var(--glass-border)]">·</span>
          <span className="flex items-center gap-1 text-[var(--text-secondary)]">
            <Clock size={12} aria-hidden="true" />
            {responseText}
          </span>
        </>
      )}
    </div>
  );
}

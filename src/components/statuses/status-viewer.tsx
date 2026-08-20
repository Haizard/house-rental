"use client";

import Link from "next/link";
import { MessageCircle, CalendarDays, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Agent = {
  id: string;
  businessName: string;
  photoUrl: string | null;
  verification: string;
};

type Status = {
  id: string;
  type: string;
  content: string;
  title: string | null;
  area: string | null;
  propertyType: string | null;
  rentAmount: number | null;
  linkedListingId: string | null;
  expiresAt: string | Date;
  createdAt: string | Date;
  _count: { views: number };
};

type AgentStatusGroup = {
  agent: Agent;
  statuses: Status[];
};

const typeEmoji: Record<string, string> = {
  AVAILABLE: "🟢",
  NEW_ROOM: "🏠",
  PRICE_DROP: "📉",
  URGENT: "🔥",
  GENERAL: "📢",
};

export function StatusViewer({
  agents,
  viewedIds,
}: {
  agents: AgentStatusGroup[];
  viewedIds: string[];
}) {
  const [selectedAgent, setSelectedAgent] = useState<AgentStatusGroup | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const router = useRouter();

  function openAgent(group: AgentStatusGroup) {
    setSelectedAgent(group);
    setCurrentIdx(0);
    // Mark all as viewed
    for (const s of group.statuses) {
      if (!viewedIds.includes(s.id)) {
        fetch(`/api/statuses/${s.id}/view`, { method: "POST" });
        viewedIds.push(s.id);
      }
    }
  }

  function close() {
    setSelectedAgent(null);
    setCurrentIdx(0);
  }

  function next() {
    if (!selectedAgent) return;
    if (currentIdx < selectedAgent.statuses.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      close();
    }
  }

  function prev() {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  }

  if (agents.length === 0) return null;

  const status = selectedAgent?.statuses[currentIdx];

  return (
    <>
      {/* Agent bubbles */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-[var(--text-secondary)]">
          🟢 Agent Status
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {agents.map((group) => {
            const hasUnviewed = group.statuses.some(
              (s) => !viewedIds.includes(s.id),
            );
            return (
              <button
                className="flex flex-col items-center gap-1.5"
                key={group.agent.id}
                type="button"
                onClick={() => openAgent(group)}
              >
                <span
                  className={`flex size-14 items-center justify-center rounded-full text-lg font-bold text-white ${
                    hasUnviewed
                      ? "ring-2 ring-[var(--accent)] ring-offset-2"
                      : "ring-1 ring-[var(--glass-border)]"
                  }`}
                  style={{
                    background: hasUnviewed
                      ? "var(--accent)"
                      : "var(--bg-base-alt)",
                    color: hasUnviewed ? "white" : "var(--text-secondary)",
                  }}
                >
                  {group.agent.businessName.charAt(0)}
                </span>
                <span className="max-w-[64px] truncate text-[10px] text-[var(--text-secondary)]">
                  {group.agent.businessName}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Full-screen status overlay */}
      {selectedAgent && status && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={close}
        >
          <div
            className="glass-surface relative flex w-full max-w-md flex-col overflow-hidden rounded-[22px]"
            style={{ maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress bars */}
            <div className="flex gap-1 px-4 pt-3">
              {selectedAgent.statuses.map((_, i) => (
                <div
                  className="h-0.5 flex-1 rounded-full"
                  key={i}
                  style={{
                    background:
                      i <= currentIdx ? "var(--accent)" : "var(--glass-border)",
                  }}
                />
              ))}
            </div>

            {/* Agent header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-sm font-bold">
                {selectedAgent.agent.businessName.charAt(0)}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">
                  {selectedAgent.agent.businessName}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {formatRelativeTime(status.createdAt)}
                </p>
              </div>
              <button
                className="text-sm text-[var(--text-secondary)]"
                onClick={close}
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Status content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="text-lg">{typeEmoji[status.type] ?? "📢"}</p>
              {status.title && (
                <h3 className="mt-2 text-lg font-bold">{status.title}</h3>
              )}
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-6">
                {status.content}
              </p>
              {status.rentAmount && (
                <p className="mt-3 text-sm font-medium text-[var(--accent)]">
                  TZS {status.rentAmount.toLocaleString()} / month
                </p>
              )}
              {status.area && (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  📍 {status.area}
                </p>
              )}
              <p className="mt-3 text-[10px] text-[var(--text-tertiary)]">
                {status._count.views} view{status._count.views !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 border-t border-black/[.06] px-4 py-3">
              <Link
                className="button button-primary min-h-10 flex-1 px-3 text-sm"
                href={`/search?area=${encodeURIComponent(status.area ?? "")}`}
                onClick={close}
              >
                <MessageCircle size={16} aria-hidden="true" /> Chat
              </Link>
              {status.linkedListingId && (
                <Link
                  className="button button-glass min-h-10 flex-1 px-3 text-sm"
                  href={`/listings/${status.linkedListingId}`}
                  onClick={close}
                >
                  View listing
                </Link>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between px-4 pb-3">
              <button
                className="text-xs text-[var(--text-secondary)]"
                disabled={currentIdx === 0}
                onClick={prev}
                type="button"
              >
                ← Previous
              </button>
              <button
                className="text-xs text-[var(--text-secondary)]"
                onClick={next}
                type="button"
              >
                {currentIdx < selectedAgent.statuses.length - 1
                  ? "Next →"
                  : "Done"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatRelativeTime(dateStr: string | Date): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

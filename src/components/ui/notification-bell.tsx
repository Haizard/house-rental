"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(unreadCount);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/notifications?limit=10");
    const data = await res.json().catch(() => ({ data: [] }));
    setNotifications(data.data ?? []);
    setLoading(false);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && notifications.length === 0) fetchNotifications();
  }

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setCount((prev) => Math.max(0, prev - 1));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.readAt);
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setCount(0);
    await fetch("/api/notifications/mark-all", { method: "PATCH" });
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        className="relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--accent-soft)]"
        type="button"
        onClick={toggle}
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
      >
        <Bell size={20} className="text-[var(--text-secondary)]" aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-[var(--danger)] text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-surface absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-[18px] shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-black/[.06] px-4 py-3">
            <h2 className="text-sm font-semibold">Notifications</h2>
            {count > 0 && (
              <button
                className="text-xs font-medium text-[var(--accent)]"
                type="button"
                onClick={markAllRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
                No notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--accent-soft)] ${
                    !n.readAt ? "bg-[var(--accent-soft)]/30" : ""
                  }`}
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.readAt) markAsRead(n.id);
                    setOpen(false);
                  }}
                >
                  {!n.readAt && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--accent)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--text-secondary)]">
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-black/[.06] px-4 py-2.5 text-center">
            <button
              className="text-xs font-medium text-[var(--accent)]"
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/notifications");
              }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Intl.DateTimeFormat("en-TZ", { dateStyle: "medium" }).format(
    new Date(dateStr),
  );
}

"use client";

import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  CreditCard,
  Home,
  MessageCircle,
  UserPlus,
  X,
} from "lucide-react";
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

function getNotificationIcon(type: string) {
  switch (type) {
    case "LEAD_NEW":
    case "LEAD_UPDATE":
      return <UserPlus size={16} className="text-[var(--accent)]" />;
    case "MESSAGE":
      return <MessageCircle size={16} className="text-emerald-500" />;
    case "LISTING_APPROVED":
    case "LISTING_REJECTED":
    case "LISTING_UPDATE":
      return <Home size={16} className="text-amber-500" />;
    case "PAYMENT":
    case "SUBSCRIPTION":
      return <CreditCard size={16} className="text-purple-500" />;
    case "VIEWING":
      return <Clock size={16} className="text-[var(--accent)]" />;
    default:
      return <Bell size={16} className="text-[var(--text-secondary)]" />;
  }
}

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(unreadCount);
  const panelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/notifications?limit=15");
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
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
    setCount((prev) => Math.max(0, prev - 1));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  }

  async function markAllRead() {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString() })),
    );
    setCount(0);
    await fetch("/api/notifications/mark-all", { method: "PATCH" });
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        className="relative flex size-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--accent-soft)]"
        type="button"
        onClick={toggle}
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ""}`}
      >
        <Bell
          size={19}
          className="text-[var(--text-secondary)]"
          aria-hidden="true"
        />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex size-4.5 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[9px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-surface animate-slide-down absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-[18px] shadow-xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--glass-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Notifications
              </h2>
              {count > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {count > 0 && (
                <button
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[var(--accent)] transition hover:bg-[var(--accent-soft)]"
                  type="button"
                  onClick={markAllRead}
                >
                  <CheckCheck size={14} />
                  Read all
                </button>
              )}
              <button
                className="flex size-7 items-center justify-center rounded-lg text-[var(--text-tertiary)] transition hover:bg-black/5 dark:hover:bg-white/5"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 p-8 text-sm text-[var(--text-secondary)]">
                <span className="size-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell
                  size={32}
                  className="mx-auto text-[var(--text-tertiary)]"
                />
                <p className="mt-3 text-sm font-medium text-[var(--text-secondary)]">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  You&apos;ll see leads, messages, and updates here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  className={`flex w-full items-start gap-3 border-b border-[var(--glass-border)] px-4 py-3 text-left transition hover:bg-[var(--accent-soft)]/50 ${
                    !n.readAt ? "bg-[var(--accent-soft)]/20" : ""
                  }`}
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.readAt) markAsRead(n.id);
                    setOpen(false);
                  }}
                >
                  {/* Icon */}
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-base-alt)]">
                    {getNotificationIcon(n.type)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-sm ${!n.readAt ? "font-semibold" : "font-medium"} text-[var(--text-primary)]`}
                      >
                        {n.title}
                      </p>
                      {!n.readAt && (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-[var(--accent)]" />
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-4 text-[var(--text-secondary)]">
                      {n.message}
                    </p>
                    <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--glass-border)] px-4 py-2.5 text-center">
            <button
              className="text-xs font-medium text-[var(--accent)] transition hover:underline"
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

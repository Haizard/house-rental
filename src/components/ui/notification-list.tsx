"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export function NotificationList({
  notifications: initial,
}: {
  notifications: NotificationItem[];
}) {
  const [notifications, setNotifications] = useState(initial);
  const router = useRouter();

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, readAt: new Date().toISOString() } : n,
      ),
    );
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  }

  async function markAllRead() {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: new Date().toISOString() })),
    );
    await fetch("/api/notifications/mark-all", { method: "PATCH" });
    router.refresh();
  }

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div>
      {unreadCount > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            className="text-sm font-medium text-[var(--accent)]"
            type="button"
            onClick={markAllRead}
          >
            Mark all as read ({unreadCount})
          </button>
        </div>
      )}

      <div className="space-y-2">
        {notifications.map((n) => (
          <button
            className={`glass-surface flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:-translate-y-0.5 ${
              !n.readAt ? "border-l-2 border-l-[var(--accent)]" : ""
            }`}
            key={n.id}
            type="button"
            onClick={() => {
              if (!n.readAt) markAsRead(n.id);
            }}
          >
            {!n.readAt && (
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[var(--accent)]" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm ${!n.readAt ? "font-semibold" : "font-medium"}`}
              >
                {n.title}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {n.message}
              </p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                {new Intl.DateTimeFormat("en-TZ", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(n.createdAt))}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

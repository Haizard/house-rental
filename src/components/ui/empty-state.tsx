"use client";

import { Home, MessageCircle, Heart, Search, Bell, AlertCircle, type LucideIcon } from "lucide-react";

type EmptyStateVariant = "listings" | "chats" | "saved" | "search" | "notifications" | "leads" | "error";

const VARIANTS: Record<EmptyStateVariant, { icon: LucideIcon; title: string; description: string; color: string }> = {
  listings: {
    icon: Home,
    title: "No listings yet",
    description: "Listings will appear here once agents publish rooms.",
    color: "var(--accent)",
  },
  chats: {
    icon: MessageCircle,
    title: "No conversations yet",
    description: "Start a conversation with an agent to see it here.",
    color: "var(--accent)",
  },
  saved: {
    icon: Heart,
    title: "No saved rooms",
    description: "Save rooms you like to see them here.",
    color: "var(--accent)",
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try different filters or search in another area.",
    color: "var(--text-secondary)",
  },
  notifications: {
    icon: Bell,
    title: "All caught up",
    description: "You'll see leads, messages, and updates here.",
    color: "var(--text-secondary)",
  },
  leads: {
    icon: AlertCircle,
    title: "No leads yet",
    description: "When students show interest, they'll appear here.",
    color: "var(--accent)",
  },
  error: {
    icon: AlertCircle,
    title: "Something went wrong",
    description: "Please try again later or contact support.",
    color: "#ef4444",
  },
};

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({
  variant = "listings",
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const config = VARIANTS[variant];
  const Icon = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}>
      {/* Illustrated circle */}
      <div
        className="mb-5 flex size-20 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${config.color} 12%, transparent)` }}
      >
        <Icon
          size={36}
          style={{ color: config.color }}
          aria-hidden="true"
        />
      </div>

      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        {title ?? config.title}
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-[var(--text-secondary)]">
        {description ?? config.description}
      </p>

      {action && (
        <button
          className="button button-primary mt-5 text-sm"
          type="button"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  CreditCard,
  Home,
  LayoutDashboard,
  MessageCircle,
  TrendingUp,
  UserCircle,
  Users,
  Zap,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { NotificationBell } from "@/components/ui/notification-bell";

export const metadata: Metadata = {
  title: "Agent Workspace | Nyumba Nearby",
};

const navItems = [
  { href: "/agent/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agent/listings", label: "Listings", icon: Home },
  { href: "/agent/leads", label: "Leads", icon: Users },
  { href: "/agent/chats", label: "Chats", icon: MessageCircle },
  { href: "/agent/statuses", label: "Status", icon: Zap },
  { href: "/agent/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/agent/billing", label: "Billing", icon: CreditCard },
  { href: "/agent/upgrade", label: "Upgrade", icon: TrendingUp },
  { href: "/agent/profile", label: "Profile", icon: UserCircle },
];

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("AGENT");

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar — frosted glass, inset from edges per §6 of design system */}
      <aside className="glass-nav fixed bottom-3 left-3 right-3 z-10 flex items-center justify-around p-2 lg:bottom-auto lg:left-4 lg:top-4 lg:flex lg:h-[calc(100vh-2rem)] lg:w-56 lg:flex-col lg:items-stretch lg:justify-start lg:p-4">
        <Link
          className="mb-6 hidden items-center gap-2 font-semibold lg:flex"
          href="/"
        >
          <span className="flex size-9 items-center justify-center rounded-[12px] bg-[var(--accent)] text-white">
            <Building2 size={19} aria-hidden="true" />
          </span>
          Nyumba Nearby
        </Link>

        <div className="hidden lg:block">
          <NotificationBell unreadCount={unreadCount} />
        </div>

        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-[12px] px-3 text-[11px] text-[var(--text-secondary)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] lg:flex-row lg:justify-start lg:gap-3 lg:text-sm"
            href={href}
            key={href}
          >
            <Icon size={19} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </aside>

      {/* Main content — offset by sidebar width on desktop, tab bar height on mobile */}
      <main className="px-4 pb-24 pt-4 sm:px-8 lg:pl-72 lg:pr-12">
        {children}
      </main>
    </div>
  );
}

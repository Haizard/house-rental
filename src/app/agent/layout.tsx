import type { Metadata } from "next";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  CalendarDays,
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
  { href: "/agent/calendar", label: "Calendar", icon: CalendarDays },
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
            {/* Mobile bottom tab bar — max 5 items per design system */}
      <nav className="bottom-tab-bar lg:hidden">
        {[
          { href: "/agent/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/agent/listings", label: "Listings", icon: Home },
          { href: "/agent/chats", label: "Chats", icon: MessageCircle },
          { href: "/agent/calendar", label: "Calendar", icon: CalendarDays },
          { href: "/", label: "Home", icon: Building2 },
        ].map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href} title={label}>
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Desktop sidebar */}
      <aside className="glass-nav fixed bottom-auto left-4 top-4 z-10 hidden h-[calc(100vh-2rem)] w-56 flex-col items-stretch justify-start overflow-visible p-4 lg:flex">
        <Link className="mb-6 flex items-center gap-2 font-semibold" href="/">
          <span className="flex size-9 items-center justify-center rounded-[12px] bg-[var(--accent)] text-white">
            <Building2 size={19} aria-hidden="true" />
          </span>
          Nyumba Nearby
        </Link>
        <NotificationBell unreadCount={unreadCount} />
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link className="flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]" href={href} key={href}>
            <Icon size={19} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
        <Link className="flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]" href="/">
          <Home size={19} aria-hidden="true" />
          <span>Home</span>
        </Link>
      </aside>

      {/* Main content — offset by sidebar width on desktop, tab bar height on mobile */}
      <main className="px-4 pb-24 pt-4 sm:px-8 lg:pl-72 lg:pr-12">
        {children}
      </main>
    </div>
  );
}

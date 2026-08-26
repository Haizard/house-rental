import type { Metadata } from "next";
import Link from "next/link";
import {
  Bookmark,
  Building2, LogOut,
  CalendarDays,
  Home,
  LayoutDashboard,
  MessageCircle,
  UserCircle,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { IconBadgeInline } from "@/components/ui/icon-badge";
import { prisma } from "@/lib/db/prisma";
import { NotificationBell } from "@/components/ui/notification-bell";

export const metadata: Metadata = {
  title: "Student Dashboard | Nyumba Nearby",
};

const navItems = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/saved", label: "Saved", icon: Bookmark },
  { href: "/student/leads", label: "Leads", icon: Home },
  { href: "/student/chats", label: "Chats", icon: MessageCircle },
  { href: "/student/viewings", label: "Viewings", icon: CalendarDays },
  { href: "/student/profile", label: "Profile", icon: UserCircle },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("STUDENT");

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar — frosted glass, inset from edges per design system §6 */}
            {/* Mobile bottom tab bar — max 5 items per design system */}
      <nav className="bottom-tab-bar lg:hidden">
        <Link href="/student/dashboard" title="Dashboard"><LayoutDashboard size={20} /><span>Dashboard</span></Link>
        <Link href="/student/saved" title="Saved"><Bookmark size={20} /><span>Saved</span></Link>
        <Link href="/student/chats" title="Chats"><MessageCircle size={20} /><span>Chats</span></Link>
        <Link href="/student/viewings" title="Viewings"><CalendarDays size={20} /><span>Viewings</span></Link>
        <Link href="/" title="Home"><Building2 size={20} /><span>Home</span></Link>
        <form action={async () => { "use server"; const { signOut } = await import("@/lib/auth/config"); await signOut({ redirectTo: "/" }); }}>
          <button type="submit" title="Sign out" className="flex flex-col items-center justify-center gap-0.5 text-[var(--danger)]">
            <LogOut size={20} />
            <span className="text-[10px]">Exit</span>
          </button>
        </form>
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
            <IconBadgeInline icon={Icon} gradient="blue" size="size-8" iconSize={16} />
            <span>{label}</span>
          </Link>
        ))}
        <Link className="flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]" href="/">
          <Home size={19} aria-hidden="true" />
          <span>Home</span>
        </Link>
        <div className="mt-auto pt-4">
          <form action={async () => { "use server"; const { signOut } = await import("@/lib/auth/config"); await signOut({ redirectTo: "/" }); }}>
            <button className="flex min-h-11 w-full items-center gap-3 rounded-[12px] px-3 text-sm text-[var(--danger)] transition hover:bg-[var(--danger-soft)]" type="submit">
              <LogOut size={19} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main content — offset by sidebar width on desktop, tab bar height on mobile */}
      <main className="px-4 pb-24 pt-4 sm:px-8 lg:pl-72 lg:pr-12">
        {children}
      </main>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  Bookmark,
  Building2,
  CalendarDays,
  Home,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  UserCircle,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { signOut } from "@/lib/auth/config";
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
      <aside className="glass-nav fixed bottom-3 left-3 right-3 z-10 flex items-center justify-around overflow-hidden p-2 lg:bottom-auto lg:left-4 lg:top-4 lg:flex lg:h-[calc(100vh-2rem)] lg:w-56 lg:flex-col lg:items-stretch lg:justify-start lg:overflow-visible lg:p-4">
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
            className="flex size-11 shrink-0 flex-col items-center justify-center overflow-hidden rounded-[12px] text-[11px] text-[var(--text-secondary)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] lg:h-auto lg:w-full lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm"
            href={href}
            key={href}
            title={label}
          >
            <Icon size={19} aria-hidden="true" />
            <span className="hidden lg:inline">{label}</span>
          </Link>
        ))}

        {/* Home + Sign Out */}
        <Link
          className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-[12px] px-3 text-[11px] text-[var(--text-secondary)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] lg:flex-row lg:justify-start lg:gap-3 lg:text-sm"
          href="/"
        >
          <Home size={19} aria-hidden="true" />
          <span className="lg:inline">Home</span>
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            className="flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-[12px] px-3 text-[11px] text-[var(--text-secondary)] transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 lg:flex-row lg:justify-start lg:gap-3 lg:text-sm"
            type="submit"
          >
            <LogOut size={19} aria-hidden="true" />
            <span className="lg:inline">Sign out</span>
          </button>
        </form>
      </aside>

      {/* Main content — offset by sidebar width on desktop, tab bar height on mobile */}
      <main className="px-4 pb-24 pt-4 sm:px-8 lg:pl-72 lg:pr-12">
        {children}
      </main>
    </div>
  );
}

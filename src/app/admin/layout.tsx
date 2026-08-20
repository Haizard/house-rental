import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  ClipboardList,
  Flag,
  Home,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Admin Dashboard | Nyumba Nearby",
};

const navItems = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/agents", label: "Agents", icon: ShieldCheck },
  { href: "/admin/listings", label: "Listings", icon: Home },
  { href: "/admin/verification", label: "Verification", icon: ClipboardList },
  { href: "/admin/reports", label: "Reports", icon: Flag },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar — frosted glass, inset from edges per design system §6 */}
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

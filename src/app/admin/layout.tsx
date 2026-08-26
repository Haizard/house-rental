import type { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  ClipboardList,
  CreditCard,
  Flag, LogOut,
  Home,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { IconBadgeInline } from "@/components/ui/icon-badge";

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
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/search-analytics", label: "Search Analytics", icon: Search },
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
            {/* Mobile bottom tab bar — max 5 items per design system */}
      <nav className="bottom-tab-bar lg:hidden">
        {[
          { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
          { href: "/admin/users", label: "Users", icon: Users },
          { href: "/admin/listings", label: "Listings", icon: Home },
          { href: "/admin/verification", label: "Verify", icon: ClipboardList },
          { href: "/", label: "Home", icon: Building2 },
        ].map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href} title={label}>
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
        <form action={async () => { "use server"; const { signOut } = await import("@/lib/auth/config"); await signOut({ redirectTo: "/" }); }}>
          <button type="submit" title="Sign out" className="flex flex-col items-center justify-center gap-0.5 text-[var(--danger)]">
            <LogOut size={20} />
            <span className="text-[10px]">Exit</span>
          </button>
        </form>
      </nav>

      {/* Desktop sidebar */}
      <aside className="glass-nav fixed bottom-auto left-4 top-4 z-10 hidden h-[calc(100vh-2rem)] w-56 flex-col items-stretch justify-start p-4 lg:flex">
        <Link className="mb-6 flex items-center gap-2 font-semibold" href="/">
          <span className="flex size-9 items-center justify-center rounded-[12px] bg-[var(--accent)] text-white">
            <Building2 size={19} aria-hidden="true" />
          </span>
          Nyumba Nearby
        </Link>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link className="flex min-h-11 items-center gap-3 rounded-[12px] px-3 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]" href={href} key={href}>
            <IconBadgeInline icon={Icon} gradient="purple" size="size-8" iconSize={16} />
            <span>{label}</span>
          </Link>
        ))}
      
        <div className="mt-auto pt-4">
          <form action={async () => { "use server"; const { signOut } = await import("@/lib/auth/config"); await signOut({ redirectTo: "/" }); }}>
            <button className="flex min-h-11 w-full items-center gap-3 rounded-[12px] px-3 text-sm text-[var(--danger)] transition hover:bg-[var(--danger-soft)]" type="submit">
              <LogOut size={19} aria-hidden="true" />
              <span>Sign out</span>
            </button>
          </form>
        </div></aside>

      {/* Main content — offset by sidebar width on desktop, tab bar height on mobile */}
      <main className="px-4 pb-24 pt-4 sm:px-8 lg:pl-72 lg:pr-12">
        {children}
      </main>
    </div>
  );
}

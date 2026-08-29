import Link from "next/link";
import { Building2 } from "lucide-react";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; [key: string]: unknown }>;
};

export function Sidebar({
  navItems,
  children,
}: {
  navItems: SidebarNavItem[];
  children?: React.ReactNode;
}) {
  return (
    <aside className="glass-nav fixed bottom-3 left-3 right-3 z-10 flex items-center justify-around overflow-hidden p-2 lg:bottom-auto lg:left-4 lg:top-4 lg:flex lg:h-[calc(100vh-2rem)] lg:w-56 lg:flex-col lg:items-stretch lg:justify-start lg:overflow-visible lg:p-4">
      <Link
        className="mb-6 hidden items-center gap-2 overflow-hidden font-semibold lg:flex"
        href="/"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] bg-[var(--accent)] text-white">
          <Building2 size={19} aria-hidden="true" />
        </span>
      </Link>

      {children}

      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[12px] text-[var(--text-secondary)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] lg:h-auto lg:w-full lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:text-sm"
          href={href}
          key={href}
          title={label}
        >
          <Icon size={20} aria-hidden="true" />
          <span className="hidden lg:inline">{label}</span>
        </Link>
      ))}
    </aside>
  );
}

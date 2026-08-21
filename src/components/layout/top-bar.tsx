"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { InstallButton } from "@/components/ui/install-button";

interface TopBarProps {
  /** Optional right-side content override */
  rightContent?: React.ReactNode;
}

/**
 * Floating top-right controls: theme toggle + PWA install button.
 * Renders on all pages.
 */
export function TopBar({ rightContent }: TopBarProps) {
  return (
    <div className="fixed right-4 top-4 z-50 flex items-center gap-2 sm:right-6 sm:top-6">
      {rightContent ?? (
        <>
          <InstallButton />
          <ThemeToggle />
        </>
      )}
    </div>
  );
}

import { Building2, LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth/config";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { InstallButton } from "@/components/ui/install-button";
import { PushNotificationProvider } from "@/components/push/push-notification-provider";

function getDashboardLink(role: string) {
  switch (role) {
    case "AGENT":
      return "/agent/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/student/dashboard";
  }
}

export async function SiteNav() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user);
  const userRole = session?.user?.role as string | undefined;

  return (
    <>
      {/* Sticky sign-out button — top-right on small screens only */}
      {isLoggedIn && (
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            className="fixed right-3 top-3 z-50 flex size-9 items-center justify-center rounded-full bg-white/70 text-[var(--text-secondary)] shadow-sm backdrop-blur-sm transition hover:bg-white hover:text-[var(--accent)] sm:hidden"
            type="submit"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </form>
      )}

      <nav className="glass-nav mx-auto flex max-w-7xl items-center justify-between overflow-hidden px-3 py-2.5 sm:px-5">
        <a
          className="flex shrink-0 items-center gap-2 font-semibold text-[var(--text-primary)]"
          href="/"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent)] text-white sm:size-9 sm:rounded-[12px]">
            <Building2 size={18} aria-hidden="true" />
          </span>
        </a>

        <div className="flex min-w-0 items-center gap-1 sm:gap-1.5">
          {/* Desktop nav links */}
          <div className="hidden items-center gap-4 text-sm text-[var(--text-secondary)] sm:flex">
            <a
              className="transition hover:text-[var(--accent)]"
              href="/#listings"
            >
              Find a home
            </a>
          </div>

          {/* Theme + Install + Notifications (small buttons, inline) */}
          <PushNotificationProvider />
          <InstallButton />
          <ThemeToggle />

          {/* Auth buttons */}
          {isLoggedIn ? (
            <Link
              className="button button-glass h-9 px-3 font-t-subhead"
              href={getDashboardLink(userRole ?? "STUDENT")}
            >
              <User size={15} /> Dashboard
            </Link>
          ) : (
            <Link
              className="button button-primary h-9 px-3 font-t-subhead sm:px-4"
              href="/auth/sign-in"
            >
              <LogIn size={15} /> Log in
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}

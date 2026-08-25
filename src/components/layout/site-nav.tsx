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
    <nav className="glass-nav mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-5">
      <a
        className="flex shrink-0 items-center gap-2 font-semibold text-[var(--text-primary)]"
        href="/"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent)] text-white sm:size-9 sm:rounded-[12px]">
          <Building2 size={18} aria-hidden="true" />
        </span>
        <span className="truncate text-[15px] sm:text-base">
          Nyumba Nearby
        </span>
      </a>

      <div className="flex items-center gap-1.5 sm:gap-2">
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
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              className="button button-glass hidden h-9 px-3 text-[13px] sm:inline-flex"
              href={getDashboardLink(userRole ?? "STUDENT")}
            >
              <User size={15} /> Dashboard
            </Link>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                className="button button-glass h-9 px-3 text-[13px]"
                type="submit"
              >
                <LogOut size={15} /> Sign out
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              className="button button-primary h-9 px-3 text-[13px] sm:px-4"
              href="/auth/sign-in"
            >
              <LogIn size={15} /> Log in
            </Link>
            <Link
              className="button button-glass hidden h-9 px-3 text-[13px] sm:inline-flex"
              href="/auth/register"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

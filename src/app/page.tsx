export const dynamic = "force-dynamic";

import { ArrowRight, Building2, LogIn, LogOut, MapPin, Search, User } from "lucide-react";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth/config";
import { ListingCard } from "@/components/listings/listing-card";
import { AISearchBar } from "@/components/listings/ai-search";
import { StatusSection } from "@/components/statuses/status-section";
import { TopBar } from "@/components/layout/top-bar";
import { getPublicListings } from "@/server/listings/get-public-listings";

const areas = ["Njiro", "Olorien", "Sakina", "Usa River"];
const universities = [
  { name: "AruSHA University", slug: "arusha-university" },
  { name: "IST-Arusha", slug: "ist-arusha" },
  { name: "KM-Arusha", slug: "km-arusha" },
];

function getDashboardLink(role: string) {
  switch (role) {
    case "AGENT": return "/agent/dashboard";
    case "ADMIN": return "/admin/dashboard";
    default: return "/student/dashboard";
  }
}

export default async function Home() {
  const session = await auth();
  const { listings } = await getPublicListings();
  const isLoggedIn = Boolean(session?.user);
  const userRole = session?.user?.role as string | undefined;

  return (
    <main className="min-h-screen overflow-hidden pb-20 pt-3 sm:px-6 md:px-8 lg:px-12">
      <TopBar />

      {/* Nav */}
      <nav className="glass-nav mx-auto flex max-w-7xl items-center justify-between px-3 py-2.5 sm:px-5">
        <a className="flex shrink-0 items-center gap-2 font-semibold text-[var(--text-primary)]" href="#top">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--accent)] text-white sm:size-9 sm:rounded-[12px]">
            <Building2 size={18} aria-hidden="true" />
          </span>
          <span className="truncate text-[15px] sm:text-base">Nyumba Nearby</span>
        </a>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Desktop nav links */}
          <div className="hidden items-center gap-4 text-sm text-[var(--text-secondary)] sm:flex">
            <a className="transition hover:text-[var(--accent)]" href="#listings">Find a home</a>
          </div>

          {/* Auth buttons */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
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
                  <LogOut size={15} /> <span className="hidden sm:inline">Sign out</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
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

      {/* Hero — compact */}
      <section id="top" className="mx-auto max-w-7xl px-1 sm:px-0">
        <div className="pt-8 sm:pt-10 lg:grid lg:max-w-3xl lg:items-start lg:gap-8 lg:pt-16">
          <div>
            <p className="eyebrow text-[11px] sm:text-xs">Student housing in Arusha</p>
            <h1 className="mt-2 text-[26px] font-bold leading-[1.1] tracking-tight text-[var(--text-primary)] sm:text-[34px] md:text-[40px] lg:text-[48px]">
              Find your next home.
            </h1>
            <p className="mt-3 max-w-lg text-[13px] leading-5 text-[var(--text-secondary)] sm:text-[15px] sm:leading-6">
              Browse rooms around Njiro and talk directly with trusted local agents.
            </p>

            {/* Search form — compact */}
            <form className="glass-search mt-5 flex gap-1.5 p-1.5 sm:mt-6 sm:gap-2 sm:p-2" action="/search">
              <label className="flex min-h-[40px] flex-1 items-center gap-2 rounded-[12px] bg-white/50 px-3 sm:min-h-[44px] sm:gap-2.5 sm:rounded-[14px]">
                <MapPin className="shrink-0 text-[var(--accent)]" size={16} aria-hidden="true" />
                <span className="sr-only">Search area</span>
                <input
                  className="w-full bg-transparent text-[13px] outline-none placeholder:text-[var(--text-tertiary)] sm:text-[14px]"
                  name="area"
                  placeholder="Area or university"
                  defaultValue="Njiro"
                />
              </label>
              <button className="button button-primary h-10 shrink-0 px-4 text-[13px] sm:h-11 sm:px-5" type="submit">
                <Search size={16} aria-hidden="true" /> Search
              </button>
            </form>

            {/* Chips — compact */}
            <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2" aria-label="Popular areas">
              {areas.map((area) => (
                <a
                  className="rounded-full border border-black/[.06] bg-white/50 px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] sm:px-3 sm:py-1.5 sm:text-[12px]"
                  href={`/search?area=${encodeURIComponent(area)}`}
                  key={area}
                >
                  {area}
                </a>
              ))}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5 sm:mt-2 sm:gap-2" aria-label="Universities">
              {universities.map((u) => (
                <a
                  className="rounded-full border border-[var(--accent)]/15 bg-[var(--accent)]/8 px-2.5 py-1 text-[11px] font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/15 sm:px-3 sm:py-1.5 sm:text-[12px]"
                  href={`/universities/${u.slug}`}
                  key={u.slug}
                >
                  🎓 {u.name}
                </a>
              ))}
            </div>

            <AISearchBar className="mt-4 sm:mt-5" />
          </div>
        </div>
      </section>

      {/* Status section */}
      <section className="mx-auto mt-6 max-w-7xl sm:mt-8">
        <StatusSection />
      </section>

      {/* Listings */}
      <section id="listings" className="mx-auto mt-6 max-w-7xl sm:mt-10">
        <div className="mb-3 flex items-end justify-between gap-4 sm:mb-5">
          <div>
            <p className="eyebrow text-[11px] sm:text-xs">Available now</p>
            <h2 className="mt-1 text-lg font-bold text-[var(--text-primary)] sm:text-xl md:text-2xl">
              Homes around Njiro
            </h2>
          </div>
          <a
            className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-[var(--accent)] sm:text-sm"
            href="/search"
          >
            See all <ArrowRight size={14} aria-hidden="true" />
          </a>
        </div>
        <div className="listing-grid">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      {/* Agent join CTA — compact inline */}
      <section className="glass-surface mx-auto mt-8 flex items-center justify-between gap-4 overflow-hidden rounded-[14px] p-4 sm:mt-10 sm:rounded-[18px] sm:p-5 lg:mt-12">
        <p className="text-[13px] font-medium text-[var(--text-secondary)] sm:text-sm">
          Are you an agent? <span className="text-[var(--text-primary)]">List your rooms for free.</span>
        </p>
        <a className="button button-glass shrink-0 px-4 py-2 text-[13px]" href="/auth/agent-signup">
          Join <ArrowRight size={16} aria-hidden="true" />
        </a>
      </section>
    </main>
  );
}

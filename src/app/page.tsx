export const dynamic = "force-dynamic";

import { ArrowRight, Building2, MapPin, Search, ShieldCheck } from "lucide-react";
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

export default async function Home() {
  const { listings } = await getPublicListings();
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
        <div className="hidden items-center gap-5 text-sm text-[var(--text-secondary)] sm:flex">
          <a className="transition hover:text-[var(--accent)]" href="#listings">Find a home</a>
          <a className="transition hover:text-[var(--accent)]" href="#agents">For agents</a>
          <a className="button button-primary h-10 px-4" href="/auth/register">Get started</a>
        </div>
      </nav>

      {/* Hero */}
      <section id="top" className="mx-auto max-w-7xl px-1 sm:px-0">
        <div className="pt-10 sm:pt-14 lg:grid lg:items-end lg:gap-8 lg:pt-24">
          {/* Left column */}
          <div>
            <p className="eyebrow text-[11px] sm:text-xs">Student housing in Arusha</p>
            <h1 className="mt-2.5 text-[28px] font-bold leading-[1.1] tracking-tight text-[var(--text-primary)] sm:text-[36px] md:text-[44px] lg:text-[56px]">
              A better way to find your next place.
            </h1>
            <p className="mt-4 max-w-xl text-[14px] leading-6 text-[var(--text-secondary)] sm:text-[15px] sm:leading-7 md:text-[17px]">
              Explore available rooms and homes around Njiro, then talk directly with a trusted local agent when one feels right.
            </p>

            {/* Search form */}
            <form className="glass-search mt-6 flex flex-col gap-2 p-1.5 sm:mt-8 sm:flex-row sm:p-2" action="/search">
              <label className="flex min-h-[44px] flex-1 items-center gap-2.5 rounded-[14px] bg-white/50 px-3 sm:gap-3 sm:rounded-[16px]">
                <MapPin className="shrink-0 text-[var(--accent)]" size={18} aria-hidden="true" />
                <span className="sr-only">Search area</span>
                <input
                  className="w-full bg-transparent text-[14px] outline-none placeholder:text-[var(--text-tertiary)] sm:text-[15px]"
                  name="area"
                  placeholder="Area or university"
                  defaultValue="Njiro"
                />
              </label>
              <button className="button button-primary h-11 shrink-0 px-5 text-[14px] sm:h-auto" type="submit">
                <Search size={17} aria-hidden="true" /> Search homes
              </button>
            </form>

            {/* Area chips */}
            <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2" aria-label="Popular areas">
              {areas.map((area) => (
                <a
                  className="rounded-full border border-black/[.06] bg-white/50 px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] sm:px-3.5 sm:py-2 sm:text-[13px]"
                  href={`/search?area=${encodeURIComponent(area)}`}
                  key={area}
                >
                  {area}
                </a>
              ))}
            </div>

            {/* University chips */}
            <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-3 sm:gap-2" aria-label="Universities">
              {universities.map((u) => (
                <a
                  className="rounded-full border border-[var(--accent)]/15 bg-[var(--accent)]/8 px-3 py-1.5 text-[12px] font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/15 sm:px-3.5 sm:py-2 sm:text-[13px]"
                  href={`/universities/${u.slug}`}
                  key={u.slug}
                >
                  🎓 {u.name}
                </a>
              ))}
            </div>

            <AISearchBar className="mt-5 sm:mt-6" />
          </div>

          {/* Right column — stat card */}
          <aside className="glass-surface relative mt-8 overflow-hidden rounded-[18px] p-4 sm:mt-10 sm:rounded-[22px] sm:p-5 lg:mt-0 lg:p-6">
            <div className="absolute -right-10 -top-8 size-32 rounded-full bg-sky-200/50 blur-3xl sm:size-40" />
            <p className="relative text-[12px] font-medium text-[var(--accent)] sm:text-sm">
              Made for real student moves
            </p>
            <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:mt-7 sm:gap-3">
              <div className="stat-tile overflow-hidden rounded-[12px] sm:rounded-[16px]">
                <strong className="text-[22px] sm:text-[26px]">150k</strong>
                <span className="text-[11px] sm:text-xs">From TZS / month</span>
              </div>
              <div className="stat-tile overflow-hidden rounded-[12px] sm:rounded-[16px]">
                <strong className="text-[22px] sm:text-[26px]">24h</strong>
                <span className="text-[11px] sm:text-xs">Typical agent reply</span>
              </div>
              <div className="col-span-2 flex items-center gap-2.5 overflow-hidden rounded-[12px] bg-white/45 p-2.5 sm:gap-3 sm:rounded-[14px] sm:p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:size-10">
                  <ShieldCheck size={18} aria-hidden="true" />
                </span>
                <p className="min-w-0 text-[12px] leading-4 text-[var(--text-secondary)] sm:text-sm sm:leading-5">
                  <b className="text-[var(--text-primary)]">Agent-led, verified listings.</b>
                  <br />
                  You choose who to contact.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Status section */}
      <section className="mx-auto mt-8 max-w-7xl sm:mt-10">
        <StatusSection />
      </section>

      {/* Listings */}
      <section id="listings" className="mx-auto mt-8 max-w-7xl sm:mt-12">
        <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
          <div>
            <p className="eyebrow text-[11px] sm:text-xs">Available now</p>
            <h2 className="mt-1 text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
              Homes around Njiro
            </h2>
          </div>
          <a
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-[var(--accent)] sm:flex"
            href="/search"
          >
            See all <ArrowRight size={16} aria-hidden="true" />
          </a>
          {/* Mobile: see all link */}
          <a
            className="flex shrink-0 items-center gap-1 text-[13px] font-medium text-[var(--accent)] sm:hidden"
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

      {/* Agent CTA */}
      <section
        id="agents"
        className="glass-surface mx-auto mt-10 overflow-hidden rounded-[18px] p-5 sm:mt-14 sm:rounded-[22px] sm:p-6 md:p-8 lg:mt-16 lg:grid lg:grid-cols-[1fr_auto] lg:items-center"
      >
        <div className="overflow-hidden">
          <p className="eyebrow text-[11px] sm:text-xs">For local agents</p>
          <h2 className="mt-2 text-lg font-bold leading-snug text-[var(--text-primary)] sm:text-xl md:text-2xl">
            Bring your available homes to students who are ready to move.
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[var(--text-secondary)] sm:text-[14px] sm:leading-6 md:text-[15px]">
            Manage listings, receive qualified leads, and keep every conversation in one place.
          </p>
        </div>
        <a
          className="button button-glass mt-4 shrink-0 px-5 sm:mt-5"
          href="/auth/agent-signup"
        >
          Join as an agent <ArrowRight size={18} aria-hidden="true" />
        </a>
      </section>
    </main>
  );
}

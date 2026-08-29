export const dynamic = "force-dynamic";

import { ArrowRight, GraduationCap, MapPin, Search } from "lucide-react";
import { ListingsSection } from "@/components/listings/listings-section";
import { StatusSection } from "@/components/statuses/status-section";
import { SiteNav } from "@/components/layout/site-nav";
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
    <main className="min-h-screen overflow-hidden px-4 pb-20 pt-3 sm:px-6 md:px-8 lg:px-12">
      <SiteNav />

      {/* Hero — compact */}
      <section id="top" className="mx-auto max-w-7xl">
        <div className="pt-8 sm:pt-10 lg:grid lg:max-w-3xl lg:items-start lg:gap-8 lg:pt-16">
          <div>
            <p className="eyebrow">Student housing in Arusha</p>
            <h1 className="mt-2 font-t-bigtitle text-[var(--text-primary)]">
              Find your next home.
            </h1>
            <p className="mt-3 max-w-lg font-t-body text-[var(--text-secondary)]">
              Browse rooms around Njiro and talk directly with trusted local agents.
            </p>

            {/* Search form — compact */}
            <form className="glass-search mt-5 flex gap-1.5 p-1.5 sm:mt-6 sm:gap-2 sm:p-2" action="/search">
              <label className="flex h-8 flex-1 items-center gap-2 rounded-lg bg-white/50 px-3 sm:h-9 sm:gap-2.5 sm:rounded-[14px]">
                <MapPin className="shrink-0 text-[var(--accent)]" size={16} aria-hidden="true" />
                <span className="sr-only">Search area</span>
                <input
                  className="w-full bg-transparent font-t-subhead outline-none placeholder:text-[var(--text-tertiary)] sm:text-[14px]"
                  name="area"
                  placeholder="Area or university"
                  defaultValue="Njiro"
                />
              </label>
              <button className="button button-primary shrink-0 px-4 text-sm sm:px-5" type="submit">
                <Search size={14} aria-hidden="true" />
              </button>
            </form>

            {/* Chips — compact */}
            <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2" aria-label="Popular areas">
              {areas.map((area) => (
                <a
                  className="rounded-lg border border-black/[.06] bg-white/50 px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] sm:px-3 sm:py-1.5 sm:text-[12px]"
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
                  className="rounded-lg border border-[var(--accent)]/15 bg-[var(--accent)]/8 px-2.5 py-1 text-[11px] font-medium text-[var(--accent)] transition hover:bg-[var(--accent)]/15 sm:px-3 sm:py-1.5 sm:text-[12px]"
                  href={`/universities/${u.slug}`}
                  key={u.slug}
                >
                  <GraduationCap size={12} aria-hidden="true" /> {u.name}
                </a>
              ))}
            </div>

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
            <p className="eyebrow">Available now</p>
            <h2 className="mt-1 font-t-headline text-[var(--text-primary)]">
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
        <ListingsSection listings={listings} />
      </section>
    </main>
  );
}

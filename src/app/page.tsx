export const dynamic = "force-dynamic";

import { ArrowRight } from "lucide-react";
import { HomeSplitView } from "@/components/listings/home-split-view";
import { StatusSection } from "@/components/statuses/status-section";
import { SiteNav } from "@/components/layout/site-nav";
import { getPublicListings } from "@/server/listings/get-public-listings";


export default async function Home() {
  const { listings } = await getPublicListings();

  return (
    <main className="min-h-screen overflow-hidden px-4 pb-20 pt-3 sm:px-6 md:px-8 lg:px-12">
      <SiteNav />

      {/* Hero — compact */}
      <section id="top" className="mx-auto max-w-7xl">
        <div className="pt-8 sm:pt-10 lg:pt-16">
          <p className="eyebrow">Student housing in Arusha</p>
          <h1 className="mt-2 font-t-bigtitle text-[var(--text-primary)]">
            Find your next home.
          </h1>
          <p className="mt-3 max-w-lg font-t-body text-[var(--text-secondary)]">
            Browse rooms around Njiro and talk directly with trusted local agents.
          </p>
        </div>
      </section>

      {/* Status section */}
      <section className="mx-auto mt-6 max-w-7xl sm:mt-8">
        <StatusSection />
      </section>

      {/* Map + Listings split view */}
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
        <HomeSplitView listings={listings} />
      </section>
    </main>
  );
}

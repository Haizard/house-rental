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
    <main className="min-h-screen px-4 pb-12 pt-4 sm:px-8 lg:px-12">
      <TopBar />
      <nav className="glass-nav mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
        <a className="flex items-center gap-2 font-semibold text-[var(--text-primary)]" href="#top"><span className="flex size-9 items-center justify-center rounded-[12px] bg-[var(--accent)] text-white"><Building2 size={19} aria-hidden="true" /></span><span>Nyumba Nearby</span></a>
        <div className="hidden items-center gap-5 text-sm text-[var(--text-secondary)] sm:flex"><a className="transition hover:text-[var(--accent)]" href="#listings">Find a home</a><a className="transition hover:text-[var(--accent)]" href="#agents">For agents</a><a className="button button-primary h-10 px-4" href="/auth/register">Get started</a></div>
      </nav>
      <section id="top" className="mx-auto grid max-w-7xl items-end gap-8 pb-10 pt-14 lg:grid-cols-[1.1fr_.9fr] lg:pt-24">
        <div><p className="eyebrow">Student housing in Arusha</p><h1 className="mt-3 max-w-3xl text-[40px] font-bold leading-[1.08] text-[var(--text-primary)] sm:text-[56px]">A better way to find your next place.</h1><p className="mt-5 max-w-xl text-[17px] leading-7 text-[var(--text-secondary)]">Explore available rooms and homes around Njiro, then talk directly with a trusted local agent when one feels right.</p>
          <form className="glass-search mt-8 flex flex-col gap-2 p-2 sm:flex-row" action="/search"><label className="flex min-h-11 flex-1 items-center gap-3 px-3"><MapPin className="text-[var(--accent)]" size={20} aria-hidden="true" /><span className="sr-only">Search area</span><input className="w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--text-tertiary)]" name="area" placeholder="Area or university" defaultValue="Njiro" /></label><button className="button button-primary px-5" type="submit"><Search size={18} aria-hidden="true" /> Search homes</button></form>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Popular areas">{areas.map((area) => <a className="filter-chip" href={`/search?area=${encodeURIComponent(area)}`} key={area}>{area}</a>)}</div>
          <div className="mt-3 flex flex-wrap gap-2" aria-label="Universities">{universities.map((u) => <a className="filter-chip bg-[var(--accent)]/10 text-[var(--accent)]" href={`/universities/${u.slug}`} key={u.slug}>{u.name}</a>)}</div>
          <AISearchBar className="mt-6" />
        </div>
        <aside className="glass-surface relative overflow-hidden p-5 sm:p-6"><div className="absolute -right-10 -top-8 size-40 rounded-full bg-sky-200/50 blur-3xl" /><p className="relative text-sm font-medium text-[var(--accent)]">Made for real student moves</p><div className="relative mt-7 grid grid-cols-2 gap-3"><div className="stat-tile"><strong>150k</strong><span>From TZS / month</span></div><div className="stat-tile"><strong>24h</strong><span>Typical agent reply</span></div><div className="col-span-2 flex items-center gap-3 rounded-[14px] bg-white/45 p-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><ShieldCheck size={20} aria-hidden="true" /></span><p className="text-sm leading-5 text-[var(--text-secondary)]"><b className="text-[var(--text-primary)]">Agent-led, verified listings.</b><br />You choose who to contact.</p></div></div></aside>
      </section>
      <section className="mx-auto max-w-7xl"><StatusSection /></section>

      <section id="listings" className="mx-auto max-w-7xl"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="eyebrow">Available now</p><h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">Homes around Njiro</h2></div><a className="hidden items-center gap-1 text-sm font-medium text-[var(--accent)] sm:flex" href="/search">See all <ArrowRight size={16} aria-hidden="true" /></a></div><div className="listing-grid">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div></section>
      <section id="agents" className="mx-auto mt-14 max-w-7xl glass-surface grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="eyebrow">For local agents</p><h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">Bring your available homes to students who are ready to move.</h2><p className="mt-2 max-w-2xl text-[15px] leading-6 text-[var(--text-secondary)]">Manage listings, receive qualified leads, and keep every conversation in one place.</p></div><a className="button button-glass px-5" href="/auth/agent-signup">Join as an agent <ArrowRight size={18} aria-hidden="true" /></a></section>
    </main>
  );
}

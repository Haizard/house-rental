import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { LeadIntake } from "@/components/listings/lead-intake";
import { ViewingRequest } from "@/components/listings/viewing-request";
import { getPublicListingById } from "@/server/listings/get-public-listings";

export default async function ListingDetailPage({ params }: PageProps<"/listings/[id]">) {
  const { id } = await params;
  const listing = await getPublicListingById(id);
  if (!listing) notFound();

  const price = new Intl.NumberFormat("en-TZ").format(listing.price);
  return (
    <main className="min-h-screen px-4 py-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <Link className="button button-glass mb-6 px-4" href="/"><ArrowLeft size={18} aria-hidden="true" /> All homes</Link>
        <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <section className="overflow-hidden rounded-[22px] border border-white/70 bg-white/45 shadow-[var(--glass-shadow)]">
            <div className="relative aspect-[4/3] sm:aspect-[16/10]"><Image src={listing.image} alt={listing.title} fill priority className="object-cover" sizes="(max-width: 1023px) 100vw, 65vw" /></div>
            <div className="p-5 sm:p-7"><p className="eyebrow">Available in {listing.area}</p><h1 className="mt-2 text-3xl font-bold leading-tight text-[var(--text-primary)] sm:text-4xl">{listing.title}</h1><div className="mt-5 grid gap-3 border-t border-black/[.07] pt-5 text-[15px] text-[var(--text-secondary)] sm:grid-cols-2"><p className="flex items-center gap-2"><MapPin className="text-[var(--accent)]" size={18} aria-hidden="true" />{listing.area}, Arusha</p><p className="flex items-center gap-2"><CalendarDays className="text-[var(--accent)]" size={18} aria-hidden="true" />Ready to arrange a viewing</p></div></div>
          </section>
          <aside className="glass-surface h-fit p-5 sm:p-6"><p className="price mt-0 text-3xl">TZS {price}<span className="text-sm font-normal text-[var(--text-secondary)]"> / month</span></p><p className="mt-2 text-[15px] text-[var(--text-secondary)]">{listing.type} in {listing.area}</p>{listing.verified && <p className="mt-5 flex items-center gap-2 text-sm font-medium text-emerald-700"><BadgeCheck size={18} aria-hidden="true" />Verified listing</p>}<Link className="mt-5 block text-sm font-medium text-[var(--accent)]" href={`/agents/${listing.agentId}`}>View agent profile</Link><div className="mt-6 space-y-3"><LeadIntake listingId={listing.id} /><ViewingRequest listingId={listing.id} /></div><div className="mt-6 border-t border-black/[.07] pt-5"><p className="flex items-start gap-3 text-sm leading-5 text-[var(--text-secondary)]"><ShieldCheck className="mt-0.5 shrink-0 text-[var(--accent)]" size={19} aria-hidden="true" />You choose the agent before opening a conversation. No fee is charged to students.</p></div></aside>
        </div>
      </div>
    </main>
  );
}

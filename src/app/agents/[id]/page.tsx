import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, MapPin, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { ListingCard } from "@/components/listings/listing-card";
import { getPublicAgent } from "@/server/agents/get-public-agent";

export default async function AgentProfilePage({ params }: PageProps<"/agents/[id]">) {
  const { id } = await params;
  const result = await getPublicAgent(id);
  if (!result) notFound();
  const { agent, listings } = result;
  return <main className="min-h-screen px-4 py-4 sm:px-8 lg:px-12"><div className="mx-auto max-w-6xl"><Link className="button button-glass mb-6 px-4" href="/"><ArrowLeft size={18} aria-hidden="true" />All homes</Link><section className="glass-surface grid gap-6 p-5 sm:p-8 md:grid-cols-[auto_1fr_auto] md:items-center"><Image className="size-24 rounded-full border-4 border-white/70 object-cover" src={agent.photo} alt={agent.businessName} width={96} height={96} /><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-bold text-[var(--text-primary)]">{agent.businessName}</h1>{agent.verified && <span className="flex items-center gap-1 text-sm font-medium text-emerald-700"><BadgeCheck size={18} aria-hidden="true" />Verified agent</span>}</div><p className="mt-3 max-w-2xl text-[15px] leading-6 text-[var(--text-secondary)]">{agent.bio}</p></div><div className="flex gap-5 text-sm text-[var(--text-secondary)]"><span className="flex items-center gap-1"><Star className="fill-amber-400 text-amber-400" size={17} aria-hidden="true" />{agent.rating} ({agent.reviews})</span><span className="flex items-center gap-1"><MapPin size={17} aria-hidden="true" />Arusha</span></div></section><section className="mt-10"><p className="eyebrow">{agent.activeListings} active homes</p><h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">Listings from {agent.businessName}</h2><div className="listing-grid mt-5">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}</div></section></div></main>;
}

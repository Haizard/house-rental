import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ListingSearch } from "@/components/listings/listing-search";
import { getPublicListings } from "@/server/listings/get-public-listings";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { area } = await searchParams;
  const { listings } = await getPublicListings();
  return <main className="min-h-screen px-4 py-4 sm:px-8 lg:px-12"><div className="mx-auto max-w-7xl"><Link className="button button-glass mb-8 px-4" href="/"><ArrowLeft size={18} aria-hidden="true" />Home</Link><p className="eyebrow">Student housing in Arusha</p><h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">Find a home</h1><p className="mt-2 text-[15px] text-[var(--text-secondary)]">Browse available rooms and homes before choosing an agent.</p><div className="mt-7"><ListingSearch listings={listings} initialArea={typeof area === "string" ? area : ""} /></div></div></main>;
}

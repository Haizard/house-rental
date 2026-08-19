import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { Listing } from "@/lib/listings";
import { SaveListingButton } from "./save-listing-button";

export function ListingCard({ listing, saved = false }: { listing: Listing; saved?: boolean }) {
  const price = new Intl.NumberFormat("en-TZ").format(listing.price);
  return <article className="listing-card"><div className="relative aspect-[4/3]"><Link href={`/listings/${listing.id}`} aria-label={`View ${listing.title}`}><Image className="listing-image" src={listing.image} alt={listing.title} fill sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw" />{listing.verified && <span className="badge">Verified</span>}</Link><SaveListingButton listingId={listing.id} initialSaved={saved} title={listing.title} /></div><Link className="block listing-content" href={`/listings/${listing.id}`}><p className="listing-title">{listing.title}</p><p className="listing-meta flex items-center gap-1"><MapPin size={12} aria-hidden="true" />{listing.type} · {listing.area}</p><p className="price">TZS {price}<span className="text-xs font-normal text-[var(--text-secondary)]"> / mo</span></p></Link></article>;
}

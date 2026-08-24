"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, MapPin } from "lucide-react";

type Recommendation = {
  id: string;
  title: string;
  type: string;
  area: string;
  price: number;
  image: string;
  verified: boolean;
  matchScore: number;
  matchReasons: string[];
};

interface RecommendationSectionProps {
  listings: Recommendation[];
  title?: string;
}

export function RecommendationSection({
  listings,
  title = "Recommended for you",
}: RecommendationSectionProps) {
  if (listings.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={18} className="text-[var(--accent)]" aria-hidden="true" />
        <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {listings.map((listing) => (
          <Link
            className="glass-surface group relative min-w-[200px] max-w-[240px] flex-1 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg"
            href={`/listings/${listing.id}`}
            key={listing.id}
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={listing.image}
                alt={listing.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="240px"
              />
              {/* Match score badge */}
              <div className="absolute right-2 top-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                {listing.matchScore}% match
              </div>
            </div>

            {/* Content */}
            <div className="p-3">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {listing.title}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                <MapPin size={10} aria-hidden="true" />
                {listing.type} · {listing.area}
              </p>
              <p className="mt-1.5 text-sm font-bold text-[var(--accent)]">
                TZS {listing.price.toLocaleString()}
                <span className="text-[10px] font-normal text-[var(--text-tertiary)]"> /mo</span>
              </p>

              {/* Match reasons */}
              {listing.matchReasons.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {listing.matchReasons.slice(0, 2).map((reason, i) => (
                    <span
                      className="rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--accent)]"
                      key={i}
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

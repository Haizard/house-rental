"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, MapPin, DollarSign, Home } from "lucide-react";
import { getAllCachedListings } from "@/lib/offline/indexed-db";

type CachedListing = {
  id: string;
  data: {
    id?: string;
    title?: string;
    price?: number;
    type?: string;
    area?: string;
    images?: Array<{ url: string }>;
  };
  cachedAt: number;
};

export default function OfflinePage() {
  const [listings, setListings] = useState<CachedListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllCachedListings().then((cached) => {
      setListings(cached as CachedListing[]);
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        {/* Offline banner */}
        <div className="glass-surface mb-6 flex items-center gap-4 p-5">
          <div className="flex size-12 items-center justify-center rounded-full bg-orange-500/10">
            <WifiOff size={24} className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">
              You&apos;re offline
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Showing listings you&apos;ve viewed before. Connect to see new ones.
            </p>
          </div>
        </div>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          className="button button-glass mb-6 flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Try again
        </button>

        {loading ? (
          <div className="py-20 text-center text-[var(--text-tertiary)]">
            Loading cached listings...
          </div>
        ) : listings.length === 0 ? (
          <div className="glass-surface py-20 text-center">
            <Home size={40} className="mx-auto mb-4 text-[var(--text-tertiary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              No cached listings
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Browse listings while online and they&apos;ll be saved for offline viewing.
            </p>
            <Link href="/" className="button button-primary mt-4 inline-flex">
              Go to home page
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-[var(--text-tertiary)]">
              {listings.length} cached {listings.length === 1 ? "listing" : "listings"}
              {" · "}
              Last updated{" "}
              {new Date(listings[0]?.cachedAt).toLocaleDateString()}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {listings.map((item) => {
                const listing = item.data;
                return (
                  <Link
                    key={item.id}
                    href={`/listings/${item.id}`}
                    className="glass-surface overflow-hidden transition hover:shadow-lg"
                  >
                    {/* Image */}
                    {listing.images?.[0]?.url ? (
                      <img
                        src={listing.images[0].url}
                        alt={listing.title || "Listing"}
                        className="aspect-[4/3] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] w-full items-center justify-center bg-[var(--glass-fill)]">
                        <Home size={32} className="text-[var(--text-tertiary)]" />
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="truncate font-bold text-[var(--text-primary)]">
                        {listing.title || "Untitled listing"}
                      </h3>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                          <MapPin size={14} className="text-[var(--accent)]" />
                          {listing.area || "Arusha"}
                        </span>
                        <span className="flex items-center gap-1 text-sm font-bold text-[var(--accent)]">
                          <DollarSign size={14} />
                          {listing.price?.toLocaleString() || "—"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                        Cached {new Date(item.cachedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  cacheListing,
  getCachedListing,
  getAllCachedListings,
  cacheSearchResults,
  getCachedSearchResults,
} from "./indexed-db";

/**
 * Cache a listing in IndexedDB when the user views it.
 * Call this from the listing detail page.
 */
export function useCacheListingOnView(listingId: string | null) {
  useEffect(() => {
    if (!listingId) return;

    // Fetch the listing data and cache it (only when online)
    if (!navigator.onLine) return;

    const controller = new AbortController();

    fetch(`/api/listings/${listingId}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (json?.data) {
          cacheListing(listingId, json.data);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [listingId]);
}

/**
 * Fetch a listing — online from network, offline from cache.
 */
export function useOfflineListing(listingId: string) {
  const [data, setData] = useState<unknown | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      if (navigator.onLine) {
        try {
          const res = await fetch(`/api/listings/${listingId}`);
          const json = await res.json();
          if (!cancelled) {
            setData(json?.data ?? null);
            setFromCache(false);
          }
          // Cache in background
          if (json?.data) cacheListing(listingId, json.data);
        } catch {
          // Network error — try cache
          const cached = await getCachedListing(listingId);
          if (!cancelled) {
            setData(cached);
            setFromCache(true);
          }
        }
      } else {
        // Offline — use cache only
        const cached = await getCachedListing(listingId);
        if (!cancelled) {
          setData(cached);
          setFromCache(true);
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [listingId]);

  return { data, loading, fromCache };
}

/**
 * Fetch search results — online from network, offline from cache.
 */
export function useOfflineSearch(query: string | null) {
  const [data, setData] = useState<unknown[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);

  useEffect(() => {
    if (!query) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const cacheKey = `search:${query}`;

    async function load() {
      setLoading(true);

      if (navigator.onLine) {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query!)}`);
          const json = await res.json();
          if (!cancelled) {
            setData(json?.data ?? []);
            setFromCache(false);
          }
          if (json?.data) cacheSearchResults(cacheKey, json.data);
        } catch {
          const cached = await getCachedSearchResults(cacheKey);
          if (!cancelled) {
            setData((cached as unknown[]) ?? []);
            setFromCache(true);
          }
        }
      } else {
        const cached = await getCachedSearchResults(cacheKey);
        if (!cancelled) {
          setData((cached as unknown[]) ?? []);
          setFromCache(true);
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, [query]);

  return { data, loading, fromCache };
}

/**
 * Get all cached listings for offline browsing.
 */
export function useCachedListings() {
  const [listings, setListings] = useState<Array<{ id: string; data: unknown; cachedAt: number }>>([]);

  const refresh = useCallback(async () => {
    const all = await getAllCachedListings();
    setListings(all);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { listings, refresh };
}

"use client";

import { useEffect } from "react";
import { cacheListing } from "@/lib/offline/indexed-db";

/**
 * Wraps listing data to cache it in IndexedDB for offline access.
 * Renders nothing — purely a side-effect component.
 */
export function ListingCacheWrapper({
  listingId,
  listingData,
}: {
  listingId: string;
  listingData: unknown;
}) {
  useEffect(() => {
    if (listingData) {
      cacheListing(listingId, listingData);
    }
  }, [listingId, listingData]);

  return null;
}

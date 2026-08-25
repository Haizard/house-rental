"use client";

import type { Listing } from "@/lib/listings";
import { SwipeToggle } from "./swipe-toggle";

export function ListingsSection({ listings }: { listings: Listing[] }) {
  return <SwipeToggle listings={listings} />;
}

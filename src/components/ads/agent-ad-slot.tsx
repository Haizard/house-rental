"use client";

import { AdSlot } from "./ad-slot";
import type { Placement } from "@/lib/ads/eligibility";

interface AgentAdSlotProps {
  placement: Placement;
  isPro: boolean;
}

/**
 * Agent-specific ad slot wrapper.
 * Passes the Pro status from the server-rendered parent.
 */
export function AgentAdSlot({ placement, isPro }: AgentAdSlotProps) {
  // Pro agents never see ads
  if (isPro) return null;

  return <AdSlot placement={placement} eligible={true} />;
}

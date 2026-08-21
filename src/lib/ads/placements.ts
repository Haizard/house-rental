import type { Placement } from "./eligibility";

export type PlacementConfig = {
  key: Placement;
  name: string;
  description: string;
  location: string;
  adFormat: "horizontal" | "vertical" | "rectangle" | "auto";
  /** AdSense ad slot ID (set in environment or config) */
  slotId?: string;
  /** Whether this placement is enabled */
  enabled: boolean;
};

/**
 * All defined ad placements.
 * Slot IDs are filled from environment variables or AdSense dashboard.
 */
export const AD_PLACEMENTS: Record<Placement, PlacementConfig> = {
  FREE_AGENT_DASHBOARD: {
    key: "FREE_AGENT_DASHBOARD",
    name: "Free Agent Dashboard",
    description: "Ad between stats and leads on the free agent dashboard",
    location: "agent-dashboard",
    adFormat: "horizontal",
    enabled: true,
  },
  FREE_AGENT_LISTINGS: {
    key: "FREE_AGENT_LISTINGS",
    name: "Free Agent Listings",
    description: "Ad in the agent listings management page",
    location: "agent-listings",
    adFormat: "horizontal",
    enabled: true,
  },
  FREE_AGENT_ANALYTICS: {
    key: "FREE_AGENT_ANALYTICS",
    name: "Free Agent Analytics",
    description: "Ad in the agent analytics/performance page",
    location: "agent-analytics",
    adFormat: "rectangle",
    enabled: true,
  },
  PUBLIC_SEARCH: {
    key: "PUBLIC_SEARCH",
    name: "Public Search",
    description: "Ad on public search/listing pages",
    location: "public-search",
    adFormat: "horizontal",
    enabled: true,
  },
  PUBLIC_LISTING: {
    key: "PUBLIC_LISTING",
    name: "Public Listing",
    description: "Ad on individual listing detail pages",
    location: "public-listing",
    adFormat: "rectangle",
    enabled: true,
  },
  PUBLIC_AREA: {
    key: "PUBLIC_AREA",
    name: "Area Pages",
    description: "Ad on area/neighborhood landing pages",
    location: "public-area",
    adFormat: "horizontal",
    enabled: true,
  },
  PUBLIC_UNIVERSITY: {
    key: "PUBLIC_UNIVERSITY",
    name: "University Pages",
    description: "Ad on university housing pages",
    location: "public-university",
    adFormat: "horizontal",
    enabled: true,
  },
};

/** Get a placement config by key */
export function getPlacement(key: Placement): PlacementConfig | undefined {
  return AD_PLACEMENTS[key];
}

/** Get all enabled placements */
export function getEnabledPlacements(): PlacementConfig[] {
  return Object.values(AD_PLACEMENTS).filter((p) => p.enabled);
}

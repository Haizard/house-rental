/**
 * AdSense configuration.
 *
 * Environment variables:
 * - NEXT_PUBLIC_ADS_ENABLED: "true" | "false"
 * - NEXT_PUBLIC_ADSENSE_CLIENT_ID: Google AdSense publisher ID (ca-pub-XXXXXXX)
 * - AD_MODE: "development" | "production"
 */

export const ADS_CONFIG = {
  /** Master switch — if false, no ads render anywhere */
  enabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "true",

  /** Google AdSense publisher ID */
  clientId: process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "",

  /** Environment mode */
  mode: (process.env.AD_MODE || process.env.NODE_ENV || "development") as
    | "development"
    | "production",

  /** Whether we're in production with real ads */
  get isProduction() {
    return this.enabled && this.mode === "production" && Boolean(this.clientId);
  },

  /** Whether we're in dev/test mode (show placeholders) */
  get isDevelopment() {
    return !this.isProduction;
  },
} as const;

/** Free plan defaults — admin can override via database */
export const FREE_PLAN_LIMITS = {
  maxActiveListings: 5,
  maxMonthlyLeads: 10,
  maxDailyStatuses: 3,
  adsEnabled: true,
  priorityLevel: 0,
} as const;

/** Pro plan defaults */
export const PRO_PLAN_LIMITS = {
  maxActiveListings: Infinity,
  maxMonthlyLeads: Infinity,
  maxDailyStatuses: 999,
  adsEnabled: false,
  priorityLevel: 1,
} as const;

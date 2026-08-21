import { prisma } from "@/lib/db/prisma";
import { ADS_CONFIG, FREE_PLAN_LIMITS } from "./ads-config";

export type Placement =
  | "FREE_AGENT_DASHBOARD"
  | "FREE_AGENT_LISTINGS"
  | "FREE_AGENT_ANALYTICS"
  | "PUBLIC_SEARCH"
  | "PUBLIC_LISTING"
  | "PUBLIC_AREA"
  | "PUBLIC_UNIVERSITY";

export type EligibilityResult = {
  eligible: boolean;
  reason?: string;
};

/**
 * Centralized eligibility check: can this user see ads on this placement?
 *
 * Rules:
 * - Ads globally disabled → no ads
 * - Admin users → no ads
 * - Pro agents → no ads in agent experience
 * - Free agents → ads on eligible placements
 * - Students → ads on public pages only
 * - Suspended accounts → normal rules apply
 */
export async function canShowAds(
  userId: string | null,
  userRole: string | null,
  placement: Placement,
): Promise<EligibilityResult> {
  // Global switch
  if (!ADS_CONFIG.enabled) {
    return { eligible: false, reason: "Ads globally disabled" };
  }

  // Admin never sees ads
  if (userRole === "ADMIN" || userRole === "OWNER") {
    return { eligible: false, reason: "Admin user" };
  }

  // Determine agent tier
  let isPro = false;
  if (userRole === "AGENT" && userId) {
    isPro = await checkProStatus(userId);
  }

  // Pro agents don't see ads in agent placements
  if (isPro && placement.startsWith("FREE_AGENT")) {
    return { eligible: false, reason: "Pro agent — ads removed" };
  }

  // Agent placements only for free agents
  if (placement.startsWith("FREE_AGENT")) {
    if (userRole !== "AGENT") {
      return { eligible: false, reason: "Not an agent" };
    }
    if (isPro) {
      return { eligible: false, reason: "Pro agent" };
    }
    return { eligible: true };
  }

  // Public placements — anyone can see them
  if (placement.startsWith("PUBLIC_")) {
    return { eligible: true };
  }

  return { eligible: false, reason: "Unknown placement" };
}

/**
 * Synchronous eligibility check (for client components).
 * Uses cached tier info from the session or props.
 */
export function canShowAdsSync(
  isPro: boolean,
  userRole: string | null,
  placement: Placement,
): EligibilityResult {
  if (!ADS_CONFIG.enabled) {
    return { eligible: false, reason: "Ads globally disabled" };
  }

  if (userRole === "ADMIN" || userRole === "OWNER") {
    return { eligible: false, reason: "Admin user" };
  }

  if (isPro && placement.startsWith("FREE_AGENT")) {
    return { eligible: false, reason: "Pro agent" };
  }

  if (placement.startsWith("FREE_AGENT")) {
    if (userRole !== "AGENT") {
      return { eligible: false, reason: "Not an agent" };
    }
    return { eligible: true };
  }

  if (placement.startsWith("PUBLIC_")) {
    return { eligible: true };
  }

  return { eligible: false, reason: "Unknown placement" };
}

/**
 * Check if an agent has Pro status.
 * Tries tier column first, then subscriptions table.
 */
async function checkProStatus(userId: string): Promise<boolean> {
  // Try tier column (may not exist)
  try {
    const agent = await prisma.agentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (agent) {
      const rows = await prisma.$queryRaw<{ tier?: string }[]>`
        SELECT tier FROM agent_profiles WHERE id = ${agent.id}::uuid LIMIT 1
      `;
      if (rows[0]?.tier === "PRO") return true;
    }
  } catch {
    /* tier column missing */
  }

  // Fallback: subscriptions table
  try {
    const agent = await prisma.agentProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (agent) {
      const sub = await prisma.subscription.findFirst({
        where: {
          agentId: agent.id,
          status: "ACTIVE",
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      });
      return Boolean(sub);
    }
  } catch {
    /* subscription table issue */
  }

  return false;
}

/**
 * Get free plan limits for an agent.
 */
export async function getFreePlanLimits(agentId: string) {
  // In the future, these could come from a database table
  // For now, return defaults
  return { ...FREE_PLAN_LIMITS };
}

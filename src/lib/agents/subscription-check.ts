import { prisma } from "@/lib/db/prisma";

/**
 * Check if an agent has an active Pro subscription.
 * Checks both the tier column (if it exists) and the subscriptions table.
 */
export async function isProAgent(agentId: string): Promise<boolean> {
  // Check tier column (may not exist in all deployments)
  try {
    const rows = await prisma.$queryRaw<{ tier?: string }[]>`
      SELECT tier FROM agent_profiles WHERE id = ${agentId}::uuid LIMIT 1
    `;
    if (rows[0]?.tier === "PRO") return true;
  } catch {
    // tier column doesn't exist
  }

  // Check subscriptions table
  try {
    const sub = await prisma.subscription.findFirst({
      where: {
        agentId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    return Boolean(sub);
  } catch {
    // subscription table issue
  }

  return false;
}

/**
 * Get Pro plan limits for display.
 */
export function getProPlanLimits() {
  return {
    maxActiveListings: Infinity,
    maxMonthlyLeads: Infinity,
    maxDailyStatuses: 999,
    adsEnabled: false,
    priorityLevel: 1,
  };
}

/**
 * Get Free plan limits for display.
 */
export function getFreePlanLimits() {
  return {
    maxActiveListings: 5,
    maxMonthlyLeads: 10,
    maxDailyStatuses: 3,
    adsEnabled: true,
    priorityLevel: 0,
  };
}

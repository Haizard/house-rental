import { Check, Zap } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { UpgradeButton } from "@/components/agent/upgrade-button";

export default async function AgentUpgradePage() {
  const session = await requireRole("AGENT");
  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, businessName: true },
  });
  if (!agent) return null;

  // Check tier via raw SQL (column may not exist yet)
  let isPro = false;
  try {
    const rows = await prisma.$queryRaw<{ tier?: string }[]>`SELECT tier FROM agent_profiles WHERE id = ${agent.id}::uuid LIMIT 1`;
    isPro = rows[0]?.tier === "PRO";
  } catch { /* tier column missing, default FREE */ }

  // Get current usage stats (agentStatus table may not exist yet)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [activeListings, monthlyLeads, monthlyStatuses] = await Promise.all([
    prisma.listing.count({ where: { agentId: agent.id, status: "ACTIVE" } }),
    prisma.lead.count({
      where: { agentId: agent.id, createdAt: { gte: monthStart } },
    }),
    prisma.agentStatus.count({
      where: { agentId: agent.id, createdAt: { gte: monthStart } },
    }).catch(() => 0),
  ]);



  return (
    <div className="mx-auto max-w-3xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Agent workspace</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          {isPro ? "Your Pro plan" : "Upgrade to Pro"}
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          {isPro
            ? "You have full access to all Pro features."
            : "Unlock unlimited listings, leads, and statuses."}
        </p>
      </header>

      {/* Current usage */}
      <div className="glass-surface mb-8 grid grid-cols-3 gap-4 p-5">
        <div className="text-center">
          <p className="text-2xl font-bold">{activeListings}</p>
          <p className="text-xs text-[var(--text-secondary)]">Active listings</p>
          <p className="text-[10px] text-[var(--text-tertiary)]">
            {isPro ? "Unlimited" : "Limit: 5"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{monthlyLeads}</p>
          <p className="text-xs text-[var(--text-secondary)]">Leads this month</p>
          <p className="text-[10px] text-[var(--text-tertiary)]">
            {isPro ? "Unlimited" : "Limit: 10"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{monthlyStatuses}</p>
          <p className="text-xs text-[var(--text-secondary)]">Statuses this month</p>
          <p className="text-[10px] text-[var(--text-tertiary)]">
            {isPro ? "Unlimited" : "Limit: 3/day"}
          </p>
        </div>
      </div>

      {/* Tier comparison */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Free tier */}
        <div
          className={`glass-surface p-6 ${
            !isPro ? "ring-2 ring-[var(--accent)]" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🆓</span>
            <h2 className="text-lg font-bold">Free Agent</h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">TZS 0 / month</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check size={16} className="text-[var(--success)]" /> 5 active listings
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-[var(--success)]" /> 10 leads / month
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-[var(--success)]" /> 3 statuses / day
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-[var(--success)]" /> Basic profile
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-[var(--success)]" /> Chat with students
            </li>
            <li className="flex items-center gap-2 text-[var(--text-tertiary)]">
              Ads displayed in dashboard
            </li>
          </ul>
          {!isPro && (
            <p className="mt-4 text-xs font-medium text-[var(--accent)]">
              Current plan
            </p>
          )}
        </div>

        {/* Pro tier */}
        <div
          className={`glass-surface p-6 ${
            isPro ? "ring-2 ring-[var(--accent)]" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">💼</span>
            <h2 className="text-lg font-bold">Pro Agent</h2>
          </div>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">TZS 20,000 / month</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check size={16} className="text-[var(--success)]" /> 50+ active listings
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-[var(--success)]" /> Unlimited leads
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-[var(--success)]" /> Unlimited statuses
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-[var(--success)]" /> No ads
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-[var(--success)]" /> Advanced analytics
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-[var(--success)]" /> Better visibility
            </li>
            <li className="flex items-center gap-2">
              <Check size={16} className="text-[var(--success)]" /> Priority support
            </li>
          </ul>
          {isPro ? (
            <p className="mt-4 text-xs font-medium text-[var(--accent)]">
              Current plan
            </p>
          ) : (
            <div className="mt-4">
              <UpgradeButton />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

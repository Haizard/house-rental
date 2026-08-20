import Link from "next/link";
import { ArrowLeft, Check, Crown, Zap } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { SubscriptionActions } from "@/components/agent/subscription-actions";

export default async function AgentSubscriptionPage() {
  const session = await requireRole("AGENT");

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, businessName: true },
  });
  if (!agent) return null;

  // Get current subscription
  const subscription = await prisma.subscription.findFirst({
    where: { agentId: agent.id, status: { in: ["ACTIVE", "PAST_DUE"] } },
    orderBy: { createdAt: "desc" },
  });

  // Get recent subscription history
  const history = await prisma.subscription.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get current month usage
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [activeListings, monthlyLeads, monthlyStatuses] = await Promise.all([
    prisma.listing.count({ where: { agentId: agent.id, status: "ACTIVE" } }),
    prisma.lead.count({
      where: { agentId: agent.id, createdAt: { gte: monthStart } },
    }),
    prisma.agentStatus
      .count({ where: { agentId: agent.id, createdAt: { gte: monthStart } } })
      .catch(() => 0),
  ]);

  const isActive = subscription?.status === "ACTIVE";
  const isPastDue = subscription?.status === "PAST_DUE";
  const isFree = !subscription || !isActive;

  return (
    <main className="min-h-screen px-4 pb-12 pt-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <Link
          className="button button-glass mb-8 px-4"
          href="/agent/dashboard"
        >
          <ArrowLeft size={18} aria-hidden="true" /> Dashboard
        </Link>

        <header className="pb-8 pt-4">
          <p className="eyebrow">Agent workspace</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Subscription
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Manage your plan, view usage, and upgrade when ready.
          </p>
        </header>

        {/* Current plan card */}
        <div
          className={`glass-surface p-6 ${
            isActive ? "ring-2 ring-emerald-500/30" : isPastDue ? "ring-2 ring-amber-500/30" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isActive ? (
                <span className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Crown size={20} />
                </span>
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <Zap size={20} />
                </span>
              )}
              <div>
                <h2 className="text-lg font-bold">
                  {isActive ? "Pro Agent" : "Free Agent"}
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  {isActive
                    ? `TZS 20,000/month — renews ${subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : "N/A"}`
                    : isPastDue
                      ? "Payment overdue — upgrade to restore Pro features"
                      : "Limited features — upgrade for unlimited access"}
                </p>
              </div>
            </div>
            {isFree && (
              <Link
                className="button button-primary px-4"
                href="/agent/upgrade"
              >
                Upgrade
              </Link>
            )}
          </div>

          {isPastDue && (
            <div className="mt-4 rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-700">
              Your subscription payment is overdue. Please renew to keep Pro features active.
            </div>
          )}

          {/* Usage stats */}
          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-gray-200/50 pt-5">
            <div className="text-center">
              <p className="text-2xl font-bold">{activeListings}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Active listings
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                {isActive ? "Unlimited" : "Limit: 5"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{monthlyLeads}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Leads this month
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                {isActive ? "Unlimited" : "Limit: 10"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{monthlyStatuses}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Statuses this month
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                {isActive ? "Unlimited" : "Limit: 3/day"}
              </p>
            </div>
          </div>
        </div>

        {/* Subscription history */}
        <section className="mt-8">
          <h2 className="text-xl font-bold">Subscription history</h2>
          {history.length === 0 ? (
            <div className="glass-surface mt-4 p-6 text-sm text-[var(--text-secondary)]">
              No subscription history yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {history.map((sub) => (
                <div key={sub.id} className="glass-surface flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{sub.planName} plan</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      Started {new Date(sub.startedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`status-pill ${
                      sub.status === "ACTIVE"
                        ? "status-active"
                        : sub.status === "CANCELLED"
                          ? "status-paused"
                          : sub.status === "PAST_DUE"
                            ? "status-draft"
                            : ""
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Plan comparison */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {/* Free tier */}
          <div
            className={`glass-surface p-5 ${!isActive ? "ring-2 ring-[var(--accent)]" : ""}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🆓</span>
              <h3 className="font-bold">Free Agent</h3>
            </div>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              TZS 0 / month
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--success)]" /> 5 active listings
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--success)]" /> 10 leads / month
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--success)]" /> 3 statuses / day
              </li>
              <li className="flex items-center gap-2 text-[var(--text-tertiary)]">
                Ads in dashboard
              </li>
            </ul>
          </div>

          {/* Pro tier */}
          <div
            className={`glass-surface p-5 ${isActive ? "ring-2 ring-emerald-500/30" : ""}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">💼</span>
              <h3 className="font-bold">Pro Agent</h3>
            </div>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              TZS 20,000 / month
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--success)]" /> 50+ active listings
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--success)]" /> Unlimited leads
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--success)]" /> Unlimited statuses
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--success)]" /> No ads
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-[var(--success)]" /> Advanced analytics
              </li>
            </ul>
          </div>
        </section>

        {/* Cancel action */}
        {isActive && (
          <div className="mt-8">
            <SubscriptionActions />
          </div>
        )}
      </div>
    </main>
  );
}

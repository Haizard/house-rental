import { prisma } from "@/lib/db/prisma";
import { StatusPill } from "@/components/ui/status-pill";

export default async function AdminPaymentsPage() {
  const [subscriptions, leadCharges, totalRevenue] = await Promise.all([
    prisma.subscription.findMany({
      include: {
        agent: {
          select: { businessName: true, user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.leadCharge.findMany({
      include: {
        lead: {
          select: {
            listing: { select: { title: true } },
            agent: { select: { businessName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.leadCharge.aggregate({
      _sum: { amount: true },
      where: { status: "SUCCEEDED" },
    }),
  ]);

  const totalSubRevenue = subscriptions.reduce((sum, s) => {
    if (s.status === "ACTIVE" && s.planName === "STANDARD") return sum + 20000;
    return sum;
  }, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Platform administration</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Payments</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Subscriptions, lead charges, and revenue overview.
        </p>
      </header>

      {/* Revenue summary */}
      <section className="mb-8 grid gap-3 sm:grid-cols-3">
        <div className="glass-surface p-4 text-center">
          <p className="text-2xl font-bold">
            TZS {(totalSubRevenue + (totalRevenue._sum.amount ?? 0)).toLocaleString()}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">Total revenue</p>
        </div>
        <div className="glass-surface p-4 text-center">
          <p className="text-2xl font-bold">
            {subscriptions.filter((s) => s.status === "ACTIVE").length}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">Active subscriptions</p>
        </div>
        <div className="glass-surface p-4 text-center">
          <p className="text-2xl font-bold">
            TZS {(totalRevenue._sum.amount ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">Lead charge revenue</p>
        </div>
      </section>

      {/* Subscriptions */}
      <section className="mb-10">
        <h2 className="text-xl font-bold">Subscriptions</h2>
        <div className="mt-4 space-y-2">
          {subscriptions.length === 0 ? (
            <div className="glass-surface p-6 text-sm text-[var(--text-secondary)]">
              No subscriptions yet.
            </div>
          ) : (
            subscriptions.map((sub) => (
              <article className="glass-surface flex items-center gap-4 p-4" key={sub.id}>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{sub.agent.businessName}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {sub.planName} · {sub.agent.user.firstName} {sub.agent.user.lastName}
                  </p>
                </div>
                <StatusPill status={sub.status} />
                <span className="text-sm font-medium">TZS 20,000</span>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Lead charges */}
      <section>
        <h2 className="text-xl font-bold">Lead charges</h2>
        <div className="mt-4 space-y-2">
          {leadCharges.length === 0 ? (
            <div className="glass-surface p-6 text-sm text-[var(--text-secondary)]">
              No lead charges yet.
            </div>
          ) : (
            leadCharges.map((charge) => (
              <article className="glass-surface flex items-center gap-4 p-4" key={charge.id}>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{charge.lead.agent.businessName}</h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {charge.lead.listing.title} ·{" "}
                    {new Intl.DateTimeFormat("en-TZ", { dateStyle: "medium" }).format(charge.createdAt)}
                  </p>
                </div>
                <StatusPill status={charge.status} />
                <span className="text-sm font-medium">TZS {charge.amount.toLocaleString()}</span>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

import { BadgeCheck, CalendarDays, ClipboardList, Crown, Home, Users } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ViewingStatus } from "@/components/agent/viewing-status";
import { VerificationForm } from "@/components/agent/verification-form";
import { AgentAdSlot } from "@/components/ads/agent-ad-slot";
import { SiteNav } from "@/components/layout/site-nav";

export default async function AgentDashboard() {
  const session = await requireRole("AGENT");
  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      listings: { where: { status: "ACTIVE" }, select: { id: true } },
      leads: {
        include: {
          listing: true,
          conversation: { select: { id: true } },
          student: { include: { user: true } },
          viewingRequests: { orderBy: { requestedAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  const pendingVerification = await prisma.verificationRecord.findFirst({
    where: {
      targetType: "AGENT",
      targetId: agent?.id ?? "",
      status: "PENDING",
    },
    select: { id: true },
  });

  // Check tier via raw SQL
  let isPro = false;
  try {
    const rows = await prisma.$queryRaw<{ tier?: string }[]>`
      SELECT tier FROM agent_profiles WHERE id = ${agent?.id ?? ""}::uuid LIMIT 1`;
    isPro = rows[0]?.tier === "PRO";
  } catch {
    /* tier column missing */
  }

  const activeListingCount = agent?.listings.length ?? 0;
  const totalLeads = agent?.leads.length ?? 0;

  return (
    <div className="mx-auto max-w-6xl">
      <SiteNav />

      <header className="flex items-end justify-between gap-4 pb-8 pt-6">
        <div>
          <p className="eyebrow">Agent workspace</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Good morning, {session.user.name?.split(" ")[0] ?? "agent"}.
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Stay close to every student enquiry.
          </p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            className="button button-glass h-9 px-3 text-[13px]"
            href="/"
          >
            View marketplace
          </Link>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-4">
        <Stat
          icon={<Home size={20} />}
          value={agent?.listings.length ?? 0}
          label="Active listings"
        />
        <Stat
          icon={<Users size={20} />}
          value={agent?.leads.length ?? 0}
          label="Recent leads"
        />
        <Stat
          icon={<CalendarDays size={20} />}
          value={
            agent?.leads.filter(
              (lead) =>
                lead.viewingRequests[0]?.status === "REQUESTED",
            ).length ?? 0
          }
          label="Pending viewings"
        />
        <Link
          href="/agent/requests"
          className="glass-surface flex items-center gap-3 p-4 transition hover:-translate-y-0.5"
        >
          <span className="flex size-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <ClipboardList size={20} />
          </span>
          <span>
            <strong className="block text-xl font-bold">Browse</strong>
            <span className="text-sm text-[var(--text-secondary)]">
              Room requests
            </span>
          </span>
        </Link>
      </section>

      <AgentAdSlot placement="FREE_AGENT_DASHBOARD" isPro={isPro} />

      {!isPro && (activeListingCount >= 4 || totalLeads >= 8) && (
        <section className="glass-surface mt-6 border border-[var(--accent)]/20 bg-gradient-to-r from-[var(--accent)]/5 to-transparent p-5">
          <div className="flex items-start gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
              <Crown size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-[var(--text-primary)]">
                Upgrade to Pro
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {activeListingCount >= 4 &&
                  `You have ${activeListingCount} active listings (limit: 5). `}
                {totalLeads >= 8 &&
                  `You've received ${totalLeads} leads. `}
                Upgrade to TZS 20,000/month for unlimited access and no ads.
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  className="button button-primary px-4 py-2 text-sm"
                  href="/agent/upgrade"
                >
                  <Crown size={14} className="mr-1" /> View plans
                </Link>
                <Link
                  className="button button-glass px-4 py-2 text-sm"
                  href="/agent/subscription"
                >
                  Manage subscription
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="glass-surface mt-10 p-5">
        <div className="mb-4 flex items-center gap-2">
          <BadgeCheck size={19} className="text-[var(--accent)]" aria-hidden="true" />
          <h2 className="text-xl font-bold">Verification</h2>
        </div>
        {agent?.verification === "VERIFIED" ||
        agent?.verification === "AGENT_VERIFIED" ? (
          <p className="text-sm text-[var(--success)]">
            Your agent profile is verified.
          </p>
        ) : (
          <VerificationForm pending={Boolean(pendingVerification)} />
        )}
      </section>

      <section id="leads" className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Lead inbox</h2>
          <span className="text-sm text-[var(--text-secondary)]">
            Newest first
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {agent?.leads.length ? (
            agent.leads.map((lead) => (
              <article
                className="glass-surface grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                key={lead.id}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">
                      {lead.student.user.firstName}{" "}
                      {lead.student.user.lastName}
                    </h3>
                    <span className="filter-chip-active rounded-full px-2 py-1 text-xs">
                      {lead.status.replaceAll("_", " ").toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {lead.listing.title} ·{" "}
                    {new Intl.DateTimeFormat("en-TZ", {
                      dateStyle: "medium",
                    }).format(lead.createdAt)}
                  </p>
                </div>
                <Link
                  className="button button-glass min-h-10 px-3 text-sm"
                  href={
                    lead.conversation
                      ? `/student/chats/${lead.conversation.id}`
                      : "#"
                  }
                >
                  Open conversation
                </Link>
              </article>
            ))
          ) : (
            <div className="glass-surface p-6 text-sm text-[var(--text-secondary)]">
              New student enquiries will appear here.
            </div>
          )}
        </div>
      </section>

      <section id="viewings" className="mt-10 pb-10">
        <h2 className="text-xl font-bold">Viewing requests</h2>
        <div className="mt-4 space-y-3">
          {agent?.leads.flatMap((lead) =>
            lead.viewingRequests.map((viewing) => (
              <article
                className="glass-surface grid gap-4 p-4 sm:grid-cols-[1fr_180px] sm:items-center"
                key={viewing.id}
              >
                <div>
                  <h3 className="font-semibold">{lead.listing.title}</h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {viewing.scheduledAt
                      ? new Intl.DateTimeFormat("en-TZ", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(viewing.scheduledAt)
                      : "Time not selected"}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    Requested by {lead.student.user.firstName}{" "}
                    {lead.student.user.lastName}
                  </p>
                </div>
                <ViewingStatus
                  viewingId={viewing.id}
                  status={viewing.status}
                />
              </article>
            )),
          )}
          {!agent?.leads.some((lead) => lead.viewingRequests.length) && (
            <div className="glass-surface p-6 text-sm text-[var(--text-secondary)]">
              Viewing requests will appear here.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="glass-surface flex items-center gap-3 p-4">
      <span className="flex size-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </span>
      <span>
        <strong className="block text-xl">{value}</strong>
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </span>
    </div>
  );
}

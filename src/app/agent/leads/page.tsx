import Link from "next/link";
import { MessageCircle, Users, GraduationCap, Wallet, MapPin, Calendar } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { StatusPill } from "@/components/ui/status-pill";
import { LeadActions } from "@/components/agent/lead-actions";
import { UpgradeButton } from "@/components/agent/upgrade-button";
import { isProAgent } from "@/lib/agents/subscription-check"

const COLUMNS = [
  { status: "NEW", label: "New", color: "var(--warning)" },
  { status: "CONTACTED", label: "Contacted", color: "var(--info)" },
  { status: "VIEWING_REQUESTED", label: "Viewing", color: "var(--info)" },
  { status: "NEGOTIATING", label: "Negotiating", color: "var(--accent)" },
  { status: "RENTED", label: "Rented", color: "var(--success)" },
] as const;

export default async function AgentLeadsPage() {
  const session = await requireRole("AGENT");
  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const isPro = agent ? await isProAgent(agent.id) : false;

  const leads = agent
    ? await prisma.lead.findMany({
        where: { agentId: agent.id },
        include: {
          listing: { select: { title: true, rentAmount: true } },
          student: {
            include: {
              user: { select: { firstName: true, lastName: true } },
              university: { select: { name: true } },
            },
          },
          conversation: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Group leads by status
  const grouped = COLUMNS.map((col) => ({
    ...col,
    leads: leads.filter((l) => l.status === col.status),
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Agent workspace</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Leads</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Track student enquiries through the rental pipeline.
        </p>
      </header>

      {leads.length === 0 ? (
        <div className="glass-surface mt-4 flex min-h-64 flex-col items-center justify-center p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <Users size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No leads yet</h2>
          <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">
            When students contact you about a listing, leads will appear here.
          </p>
        </div>
      ) : (
        /* Kanban — horizontal scroll on mobile, grid on desktop */
        <div className="flex gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-5 sm:overflow-visible">
          {grouped.map((col) => (
            <div className="min-w-[260px] sm:min-w-0" key={col.status}>
              <div className="mb-3 flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: col.color }}
                />
                <h2 className="text-sm font-semibold">{col.label}</h2>
                <span className="text-xs text-[var(--text-tertiary)]">
                  ({col.leads.length})
                </span>
              </div>
              <div className="space-y-2">
                {col.leads.length === 0 ? (
                  <div className="glass-surface p-4 text-center text-xs text-[var(--text-tertiary)]">
                    No leads
                  </div>
                ) : (
                  col.leads.map((lead) => (
                    <article
                      className="glass-surface flex flex-col overflow-hidden space-y-2 p-3"
                      key={lead.id}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">
                          {lead.student.user.firstName}{" "}
                          {lead.student.user.lastName}
                        </h3>
                        <StatusPill status={lead.status} />
                      </div>
                      <p className="min-w-0 truncate text-xs text-[var(--text-secondary)]">
                        {lead.listing.title}
                      </p>
                      <p className="text-xs font-medium text-[var(--text-primary)]">
                        TZS {lead.listing.rentAmount.toLocaleString()} / mo
                      </p>

                      {/* Premium Lead Insights */}
                      {isPro ? (
                        <div className="space-y-1 border-t border-[var(--glass-border)] pt-2">
                          {lead.budget && (
                            <p className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                              <Wallet size={10} className="text-[var(--accent)]" />
                              Budget: TZS {lead.budget.toLocaleString()}
                            </p>
                          )}
                          {lead.student.university && (
                            <p className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                              <GraduationCap size={10} className="text-[var(--accent)]" />
                              {lead.student.university.name}
                            </p>
                          )}
                          {lead.student.preferredArea && (
                            <p className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                              <MapPin size={10} className="text-[var(--accent)]" />
                              Prefers: {lead.student.preferredArea}
                            </p>
                          )}
                          {lead.moveInDate && (
                            <p className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
                              <Calendar size={10} className="text-[var(--accent)]" />
                              Move-in: {new Intl.DateTimeFormat("en-TZ", { dateStyle: "medium" }).format(lead.moveInDate)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="border-t border-[var(--glass-border)] pt-2">
                          <p className="text-[10px] text-[var(--text-tertiary)]">
                            Upgrade to Pro for student details
                          </p>
                        </div>
                      )}

                      <p className="text-[10px] text-[var(--text-tertiary)]">
                        {new Intl.DateTimeFormat("en-TZ", {
                          dateStyle: "medium",
                        }).format(lead.createdAt)}
                      </p>
                      <div className="flex gap-2 pt-1">
                        {lead.conversation && (
                          <Link
                            className="button button-glass min-h-8 min-w-0 flex-1 px-2 text-[11px]"
                            href={`/agent/chats/${lead.conversation.id}`}
                          >
                            <MessageCircle size={13} aria-hidden="true" /> Chat
                          </Link>
                        )}
                        <LeadActions leadId={lead.id} currentStatus={lead.status} />
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { StatusPill } from "@/components/ui/status-pill";
import { AgentActions } from "@/components/admin/agent-actions";

export default async function AdminAgentsPage() {
  const agents = await prisma.agentProfile.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true, isActive: true } },
      listings: { where: { status: "ACTIVE" }, select: { id: true } },
      leads: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Platform administration</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Agents</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          View agent profiles, verification status, and manage access.
        </p>
      </header>

      <div className="space-y-3">
        {agents.length === 0 ? (
          <div className="glass-surface p-8 text-center">
            <ShieldCheck className="mx-auto text-[var(--text-tertiary)]" size={28} aria-hidden="true" />
            <h2 className="mt-3 font-semibold">No agents yet</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Agent registrations will appear here.
            </p>
          </div>
        ) : (
          agents.map((agent) => (
            <article className="glass-surface grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center" key={agent.id}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{agent.businessName}</h3>
                  <StatusPill status={agent.verification} />
                  {!agent.user.isActive && (
                    <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
                    >
                      suspended
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                  {agent.user.firstName} {agent.user.lastName} · {agent.user.email}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                  {agent.listings.length} active listings · {agent.leads.length} leads
                </p>
              </div>
              <AgentActions agentId={agent.id} userId={agent.userId} isActive={agent.user.isActive} />
            </article>
          ))
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { ChevronRight, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { StatusPill } from "@/components/ui/status-pill";

export default async function StudentLeadsPage() {
  const session = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const leads = profile
    ? await prisma.lead.findMany({
        where: { studentId: profile.id },
        include: {
          listing: { select: { title: true, rentAmount: true, propertyType: true } },
          agent: { select: { businessName: true } },
          conversation: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Student workspace</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Your leads</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Conversations you&apos;ve started with agents.
        </p>
      </header>

      {leads.length === 0 ? (
        <div className="glass-surface mt-4 flex min-h-64 flex-col items-center justify-center p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <MessageCircle size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No leads yet</h2>
          <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">
            Tap &quot;Chat with agent&quot; on any listing to create your first lead.
          </p>
          <Link
            className="button button-primary mt-6 px-5"
            href="/search"
          >
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const href = lead.conversation
              ? `/student/chats/${lead.conversation.id}`
              : "/student/leads";
            return (
              <Link
                className="glass-surface flex items-center gap-4 p-4 transition hover:-translate-y-0.5"
                href={href}
                key={lead.id}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold">
                      {lead.listing.title}
                    </h3>
                    <StatusPill status={lead.status} />
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {lead.agent.businessName} ·{" "}
                    {lead.listing.rentAmount.toLocaleString()} TZS / mo
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                    {new Intl.DateTimeFormat("en-TZ", {
                      dateStyle: "medium",
                    }).format(lead.createdAt)}
                  </p>
                </div>
                <ChevronRight
                  className="shrink-0 text-[var(--text-tertiary)]"
                  size={18}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

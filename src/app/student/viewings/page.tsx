import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { StatusPill } from "@/components/ui/status-pill";

export default async function StudentViewingsPage() {
  const session = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const viewings = profile
    ? await prisma.viewingRequest.findMany({
        where: { lead: { studentId: profile.id } },
        include: {
          lead: {
            include: {
              listing: { select: { title: true, propertyType: true } },
              agent: { select: { businessName: true } },
              conversation: { select: { id: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Student workspace</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Viewing requests
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Property viewings you&apos;ve arranged with agents.
        </p>
      </header>

      {viewings.length === 0 ? (
        <div className="glass-surface mt-4 flex min-h-64 flex-col items-center justify-center p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <CalendarDays size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No viewings yet</h2>
          <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">
            Request a viewing from any listing detail page to schedule a visit.
          </p>
          <Link
            className="button button-primary mt-6"
            href="/search"
          >
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {viewings.map((viewing) => (
            <article
              className="glass-surface grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              key={viewing.id}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">
                    {viewing.lead.listing.title}
                  </h3>
                  <StatusPill status={viewing.status} />
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {viewing.lead.agent.businessName} ·{" "}
                  {viewing.lead.listing.propertyType}
                </p>
                {viewing.scheduledAt ? (
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    <CalendarDays
                      className="mr-1 inline-block text-[var(--accent)]"
                      size={15}
                      aria-hidden="true"
                    />
                    {new Intl.DateTimeFormat("en-TZ", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(viewing.scheduledAt)}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    Time not yet confirmed
                  </p>
                )}
                {viewing.notes && (
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {viewing.notes}
                  </p>
                )}
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Requested{" "}
                  {new Intl.DateTimeFormat("en-TZ", {
                    dateStyle: "medium",
                  }).format(viewing.createdAt)}
                </p>
              </div>
              {viewing.lead.conversation && (
                <Link
                  className="button button-glass px-3 text-sm"
                  href={`/student/chats/${viewing.lead.conversation.id}`}
                >
                  Open chat
                </Link>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

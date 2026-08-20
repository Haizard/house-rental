import { BadgeCheck, Check, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { VerificationReview } from "@/components/admin/verification-review";

export default async function AdminVerificationPage() {
  const applications = await prisma.verificationRecord.findMany({
    where: { targetType: "AGENT", status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  const agentIds = applications.map((a) => a.targetId);
  const agents = await prisma.agentProfile.findMany({
    where: { id: { in: agentIds } },
    include: {
      user: true,
      listings: { where: { status: "ACTIVE" }, select: { id: true } },
    },
  });
  const agentById = new Map(agents.map((a) => [a.id, a]));

  return (
    <div className="mx-auto max-w-6xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Platform administration</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Agent verification
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Review evidence before a profile receives the verified badge.
        </p>
      </header>

      <div className="space-y-3">
        {applications.length ? (
          applications.map((application) => {
            const agent = agentById.get(application.targetId);
            return (
              <article
                className="glass-surface grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-center"
                key={application.id}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <BadgeCheck
                      className="text-[var(--accent)]"
                      size={20}
                      aria-hidden="true"
                    />
                    <h2 className="text-lg font-semibold">
                      {agent?.businessName ?? "Unknown agent"}
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {agent?.user.firstName} {agent?.user.lastName} ·{" "}
                    {agent?.listings.length ?? 0} active listings
                  </p>
                  <p className="mt-4 max-w-2xl text-sm leading-6">
                    {application.notes}
                  </p>
                  <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                    Submitted{" "}
                    {new Intl.DateTimeFormat("en-TZ", {
                      dateStyle: "medium",
                    }).format(application.createdAt)}
                  </p>
                </div>
                <VerificationReview verificationId={application.id} />
              </article>
            );
          })
        ) : (
          <div className="glass-surface p-8 text-center">
            <Check
              className="mx-auto text-[var(--success)]"
              size={28}
              aria-hidden="true"
            />
            <h2 className="mt-3 font-semibold">Queue is clear</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              New verification applications will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

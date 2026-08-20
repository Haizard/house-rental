import { AlertTriangle, ClipboardList } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { ReportResolution } from "@/components/admin/report-resolution";

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    include: { reporter: true },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Platform administration</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Reports and complaints
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Review marketplace concerns and record the decision.
        </p>
      </header>

      <div className="space-y-3">
        {reports.length ? (
          reports.map((report) => (
            <article
              className="glass-surface grid gap-5 p-5 lg:grid-cols-[1fr_280px] lg:items-center"
              key={report.id}
            >
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="text-[var(--warning)]"
                    size={20}
                    aria-hidden="true"
                  />
                  <h2 className="text-lg font-semibold">
                    {report.reason.toLowerCase()}
                  </h2>
                </div>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {report.targetType.toLowerCase()} · reported by{" "}
                  {report.reporter.firstName} {report.reporter.lastName}
                </p>
                <p className="mt-4 text-sm leading-6">
                  {report.description || "No additional details provided."}
                </p>
                <p className="mt-3 text-xs text-[var(--text-tertiary)]">
                  Submitted{" "}
                  {new Intl.DateTimeFormat("en-TZ", {
                    dateStyle: "medium",
                  }).format(report.createdAt)}
                </p>
              </div>
              <ReportResolution reportId={report.id} />
            </article>
          ))
        ) : (
          <div className="glass-surface p-8 text-center">
            <ClipboardList
              className="mx-auto text-[var(--success)]"
              size={28}
              aria-hidden="true"
            />
            <h2 className="mt-3 font-semibold">Queue is clear</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              New complaints will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

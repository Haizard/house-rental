import { ArrowLeft, Clock, Eye, Plus, Users } from "lucide-react";
import Link from "next/link";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";

export default async function StudentRequestsPage() {
  const session = await requireRole("STUDENT");

  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const requests = student
    ? await prisma.roomRequest.findMany({
        where: { studentId: student.id },
        orderBy: { createdAt: "desc" },
        include: {
          responses: {
            select: {
              id: true,
              status: true,
              proposedRent: true,
              message: true,
              createdAt: true,
              agent: { select: { id: true, businessName: true } },
              listing: { select: { id: true, title: true, rentAmount: true, images: { take: 1, select: { url: true } } } },
            },
          },
        },
      })
    : [];

  return (
    <main className="min-h-screen px-4 py-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <Link className="button button-glass mb-6 px-4" href="/student/dashboard">
          <ArrowLeft size={18} /> Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Room Requests</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Post what you need and agents will compete to offer you the best room.
            </p>
          </div>
          <Link className="button button-primary px-4" href="/student/requests/new">
            <Plus size={16} /> New Request
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="glass-surface mt-8 rounded-2xl p-10 text-center">
            <Users size={40} className="mx-auto text-[var(--text-tertiary)]" />
            <p className="mt-4 font-medium text-[var(--text-primary)]">No room requests yet</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Post your first request and let agents find the perfect room for you.
            </p>
            <Link className="button button-primary mt-5 px-5" href="/student/requests/new">
              Post a Request
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {requests.map((req) => {
              const selected = req.responses.find((r) => r.status === "SELECTED");
              return (
                <div key={req.id} className="glass-surface rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-semibold text-[var(--text-primary)]">{req.title}</h2>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {req.area}
                        {req.propertyType ? ` · ${req.propertyType}` : ""}
                        {req.rentMax ? ` · Up to TZS ${req.rentMax.toLocaleString()}/mo` : ""}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        req.status === "OPEN"
                          ? "bg-emerald-100 text-emerald-700"
                          : req.status === "SELECTED"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-[var(--accent-soft)] text-[var(--accent)]"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  {req.amenities.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {req.amenities.map((a) => (
                        <span key={a} className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent)]">
                          {a}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Response summary */}
                  <div className="mt-4 border-t border-black/[.07] pt-3">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">
                      {req.responses.length} {req.responses.length === 1 ? "response" : "responses"}
                    </p>

                    {selected && (
                      <div className="mt-2 rounded-xl bg-blue-50 p-3">
                        <p className="text-xs font-medium text-blue-700">
                          ✓ Selected: {selected.agent.businessName}
                          {selected.listing ? ` — ${selected.listing.title}` : ""}
                        </p>
                        <Link
                          className="mt-2 inline-block text-xs font-medium text-[var(--accent)] hover:underline"
                          href={`/student/chats`}
                        >
                          Go to chat →
                        </Link>
                      </div>
                    )}

                    {req.responses.length > 0 && req.status === "OPEN" && (
                      <div className="mt-3 space-y-2">
                        {req.responses.map((resp) => (
                          <div key={resp.id} className="flex items-center justify-between rounded-xl bg-white/40 p-3">
                            <div>
                              <p className="text-sm font-medium text-[var(--text-primary)]">{resp.agent.businessName}</p>
                              <p className="text-xs text-[var(--text-secondary)] line-clamp-1">{resp.message}</p>
                              {resp.proposedRent && (
                                <p className="text-xs font-medium text-[var(--accent)]">TZS {resp.proposedRent.toLocaleString()}/mo</p>
                              )}
                              {resp.listing && (
                                <p className="text-[11px] text-[var(--text-secondary)]">
                                  Listing: {resp.listing.title} (TZS {resp.listing.rentAmount.toLocaleString()}/mo)
                                </p>
                              )}
                            </div>
                            <form method="POST" action={`/api/student/room-requests/${req.id}/select`}>
                              <input type="hidden" name="responseId" value={resp.id} />
                              <button
                                type="submit"
                                className="button button-primary px-3 py-1.5 text-xs"
                              >
                                Select
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

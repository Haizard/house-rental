import { Bookmark, CalendarDays, ChevronRight, ClipboardList, MessageCircle } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { StatusPill } from "@/components/ui/status-pill";

export default async function StudentDashboard() {
  const session = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      savedListings: {
        include: { listing: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      leads: {
        include: {
          listing: true,
          conversation: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  return (
    <div className="mx-auto max-w-5xl">
            <header className="flex items-end justify-between gap-4 pb-8 pt-6">
        <div>
          <p className="eyebrow">Student dashboard</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Welcome back, {session.user.name?.split(" ")[0] ?? "student"}.
          </h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Keep track of homes you like and conversations you start.
          </p>
        </div>      </header>

      {/* Quick stats */}
      <section className="grid gap-3 sm:grid-cols-3">
        <DashboardLink
          href="/student/saved"
          icon={<Bookmark size={20} />}
          label="Saved homes"
          value={profile?.savedListings.length ?? 0}
        />
        <DashboardLink
          href="/student/leads"
          icon={<MessageCircle size={20} />}
          label="Active leads"
          value={profile?.leads.length ?? 0}
        />
        <DashboardLink
          href="/student/viewings"
          icon={<CalendarDays size={20} />}
          label="Viewings"
          value="Soon"
        />
        <DashboardLink
          href="/student/requests"
          icon={<ClipboardList size={20} />}
          label="Room Requests"
          value="Post"
        />
      </section>

      {/* Recent leads */}
      <section className="mt-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <MessageCircle size={19} aria-hidden="true" /> Recent leads
          </h2>
          <Link
            className="text-sm font-medium text-[var(--accent)]"
            href="/student/leads"
          >
            View all
          </Link>
        </div>
        {profile?.leads.length ? (
          <div className="mt-4 space-y-3">
            {profile.leads.map((lead) => (
              <Link
                className="glass-surface flex items-center gap-4 p-4 transition hover:-translate-y-0.5"
                href={
                  lead.conversation
                    ? `/student/chats/${lead.conversation.id}`
                    : "/student/leads"
                }
                key={lead.id}
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">
                    {lead.listing.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {lead.listing.rentAmount.toLocaleString()} TZS / mo
                  </p>
                </div>
                <StatusPill status={lead.status} />
                <ChevronRight
                  className="shrink-0 text-[var(--text-tertiary)]"
                  size={18}
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            text="Start a conversation from a listing to create your first lead."
            href="/search"
            action="Browse listings"
          />
        )}
      </section>

      {/* Saved homes preview */}
      <section className="mt-10 pb-10">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Bookmark size={19} aria-hidden="true" /> Saved homes
          </h2>
          <Link
            className="text-sm font-medium text-[var(--accent)]"
            href="/student/saved"
          >
            View all
          </Link>
        </div>
        {profile?.savedListings.length ? (
          <div className="listing-grid mt-4">
            {profile.savedListings.map(({ listing }) => (
              <Link
                className="listing-card"
                href={`/listings/${listing.id}`}
                key={listing.id}
              >
                <div className="listing-content">
                  <p className="listing-title">{listing.title}</p>
                  <p className="listing-meta">{listing.propertyType}</p>
                  <p className="price">
                    TZS {listing.rentAmount.toLocaleString()}
                    <span className="text-xs font-normal text-[var(--text-secondary)]">
                      {" "}
                      / mo
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            text="Homes you save will appear here."
            href="/search"
            action="Explore listings"
          />
        )}
      </section>
    </div>
  );
}

function DashboardLink({
  href,
  icon,
  label,
  value,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <Link
      className="glass-surface flex items-center gap-3 p-4 transition hover:-translate-y-0.5"
      href={href}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
        {icon}
      </span>
      <span>
        <strong className="block text-xl">{value}</strong>
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </span>
      <ChevronRight
        className="ml-auto text-[var(--text-tertiary)]"
        size={18}
        aria-hidden="true"
      />
    </Link>
  );
}

function EmptyState({
  text,
  href,
  action,
}: {
  text: string;
  href: string;
  action: string;
}) {
  return (
    <div className="glass-surface mt-4 p-6">
      <p className="text-sm text-[var(--text-secondary)]">{text}</p>
      <Link className="button button-glass mt-4 px-4" href={href}>
        {action}
      </Link>
    </div>
  );
}

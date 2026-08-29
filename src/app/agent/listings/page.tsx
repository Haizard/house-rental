import Link from "next/link";
import Image from "next/image";
import { Home, Plus } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { StatusPill } from "@/components/ui/status-pill";
import { AgentAdSlot } from "@/components/ads/agent-ad-slot";

export default async function AgentListingsPage() {
  const session = await requireRole("AGENT");
  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user!.id },
    select: { id: true },
  });

  const listings = agent
    ? await prisma.listing.findMany({
        where: { agentId: agent.id },
        include: {
          property: { select: { area: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Check tier for ad eligibility
  let isPro = false;
  try {
    const rows = await prisma.$queryRaw<{ tier?: string }[]>`SELECT tier FROM agent_profiles WHERE id = ${agent?.id ?? ""}::uuid LIMIT 1`;
    isPro = rows[0]?.tier === "PRO";
  } catch { /* tier column missing */ }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex items-end justify-between gap-4 pb-8 pt-10">
        <div>
          <p className="eyebrow">Agent workspace</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">My listings</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Create, edit, and manage your property listings.
          </p>
        </div>
        <Link
          className="button button-primary hidden px-4 sm:inline-flex"
          href="/agent/listings/new"
        >
          <Plus size={18} aria-hidden="true" /> New listing
        </Link>
      </header>

      {/* Mobile FAB */}
      <Link
        className="button button-primary fixed bottom-28 right-5 z-20 size-14 rounded-full px-0 shadow-lg sm:hidden"
        href="/agent/listings/new"
        aria-label="Create new listing"
      >
        <Plus size={22} aria-hidden="true" />
      </Link>

      {listings.length === 0 ? (
        <div className="glass-surface mt-4 flex min-h-64 flex-col items-center justify-center p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <Home size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No listings yet</h2>
          <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">
            Create your first listing to start receiving student enquiries.
          </p>
          <Link
            className="button button-primary mt-6"
            href="/agent/listings/new"
          >
            <Plus size={18} aria-hidden="true" /> Create listing
          </Link>
        </div>
      ) : (
        <div className="listing-grid">
          {listings.map((listing) => (
            <Link
              className="listing-card"
              href={`/agent/listings/${listing.id}/edit`}
              key={listing.id}
            >
              <div className="relative aspect-[4/3]">
                {listing.images[0] ? (
                  <Image
                    className="listing-image"
                    src={listing.images[0].url}
                    alt={listing.title}
                    fill
                    sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                  />
                ) : (
                  <div className="listing-image flex items-center justify-center bg-[var(--bg-base-alt)]">
                    <Home
                      size={32}
                      className="text-[var(--text-tertiary)]"
                      aria-hidden="true"
                    />
                  </div>
                )}
                <span className="absolute left-2 top-2">
                  <StatusPill status={listing.status} />
                </span>
              </div>
              <div className="listing-content">
                <p className="listing-title">{listing.title}</p>
                <p className="listing-meta">
                  {listing.propertyType} · {listing.property.area}
                </p>
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
      )}
      <AgentAdSlot placement="FREE_AGENT_LISTINGS" isPro={isPro} />
    </div>
  );
}

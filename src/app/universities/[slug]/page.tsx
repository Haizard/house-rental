import Link from "next/link";
import { ArrowLeft, MapPin, Users } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { ListingCard } from "@/components/listings/listing-card";

export default async function UniversityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const university = await prisma.university.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      description: true,
      city: true,
      latitude: true,
      longitude: true,
      _count: { select: { students: true } },
    },
  });

  if (!university) {
    return (
      <main className="min-h-screen px-4 py-4 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <Link className="button button-glass mb-8 px-4" href="/">
            <ArrowLeft size={18} aria-hidden="true" /> Home
          </Link>
          <h1 className="text-3xl font-bold">University not found</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            We couldn&apos;t find a university with that slug.
          </p>
        </div>
      </main>
    );
  }

  // Find listings near this university's area
  const listings = await prisma.listing.findMany({
    where: {
      status: "ACTIVE",
      property: {
        OR: [
          { area: { contains: university.name.split(" ")[0], mode: "insensitive" as const } },
          ...(university.city ? [{ area: { contains: university.city, mode: "insensitive" as const } }] : []),
        ],
      },
    },
    include: {
      property: true,
      agent: { select: { businessName: true, rating: true, verification: true } },
      images: { where: { isPrimary: true }, take: 1 },
      _count: { select: { savedBy: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Map to Listing type for ListingCard
  const mappedListings = listings.map((l) => ({
    id: l.id,
    title: l.title,
    type: l.propertyType,
    area: l.property.area,
    price: l.rentAmount,
    image: l.images[0]?.url ?? "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=82",
    verified: l.verificationStatus === "VERIFIED",
    agentId: l.agentId,
  }));

  return (
    <main className="min-h-screen px-4 pb-12 pt-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Link className="button button-glass mb-8 px-4" href="/">
          <ArrowLeft size={18} aria-hidden="true" /> Home
        </Link>

        {/* University header */}
        <header className="glass-surface p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-[14px] bg-[var(--accent)]/10 text-[var(--accent)]">
              <Users size={28} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl">
                {university.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <MapPin size={14} /> {university.city}
                </span>
                <span>
                  {university._count.students} student{university._count.students !== 1 ? "s" : ""} on Nyumba Nearby
                </span>
              </div>
              {university.description && (
                <p className="mt-3 max-w-2xl font-t-body leading-6 text-[var(--text-secondary)]">
                  {university.description}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Listings near university */}
        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Nearby homes</p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                Rooms near {university.name}
              </h2>
            </div>
            <a
              className="hidden items-center gap-1 text-sm font-medium text-[var(--accent)] sm:flex"
              href={`/search?area=${encodeURIComponent(university.city)}`}
            >
              See all in {university.city}
            </a>
          </div>

          {listings.length === 0 ? (
            <div className="glass-surface p-8 text-center">
              <p className="text-[var(--text-secondary)]">
                No listings found near {university.name} yet.
              </p>
              <a
                className="button button-primary mt-4 inline-flex"
                href="/search"
              >
                Browse all listings
              </a>
            </div>
          ) : (
            <div className="listing-grid">
              {mappedListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </section>

        {/* CTA for agents */}
        <section className="glass-surface mt-10 grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="eyebrow">For local agents</p>
            <h2 className="mt-2 text-xl font-bold text-[var(--text-primary)]">
              List rooms near {university.name}
            </h2>
            <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
              Students at {university.name} are looking for rooms. List your properties to reach them.
            </p>
          </div>
          <a className="button button-glass" href="/auth/agent-signup">
            Join as an agent
          </a>
        </section>
      </div>
    </main>
  );
}

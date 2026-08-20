import Link from "next/link";
import { Bookmark, Search } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";

export default async function SavedListingsPage() {
  const session = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const saved = profile
    ? await prisma.savedListing.findMany({
        where: { studentId: profile.id },
        include: {
          listing: {
            include: {
              property: { select: { area: true } },
              images: { orderBy: { sortOrder: "asc" }, take: 1 },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex items-end justify-between gap-4 pb-8 pt-10">
        <div>
          <p className="eyebrow">Student workspace</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Saved homes</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Homes you&apos;ve bookmarked for later.
          </p>
        </div>
        <Link
          className="button button-glass hidden px-4 sm:inline-flex"
          href="/search"
        >
          <Search size={17} aria-hidden="true" /> Browse more
        </Link>
      </header>

      {saved.length === 0 ? (
        <div className="glass-surface mt-4 flex min-h-64 flex-col items-center justify-center p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <Bookmark size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No saved homes yet</h2>
          <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">
            Tap the heart icon on any listing to save it here.
          </p>
          <Link
            className="button button-primary mt-6 px-5"
            href="/search"
          >
            <Search size={18} aria-hidden="true" /> Browse listings
          </Link>
        </div>
      ) : (
        <div className="listing-grid">
          {saved.map((item) => (
            <Link
              className="listing-card"
              href={`/listings/${item.listing.id}`}
              key={item.id}
            >
              <div className="listing-content">
                <p className="listing-title">{item.listing.title}</p>
                <p className="listing-meta">
                  {item.listing.propertyType} · {item.listing.property.area}
                </p>
                <p className="price">
                  TZS {item.listing.rentAmount.toLocaleString()}
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
    </div>
  );
}

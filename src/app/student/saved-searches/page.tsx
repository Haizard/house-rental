import Link from "next/link";
import { Search } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { SavedSearchesList } from "@/components/student/saved-searches-list";

export default async function SavedSearchesPage() {
  const session = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const searches = profile
    ? await prisma.savedSearch.findMany({
        where: { studentId: profile.id },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Count matches for each search
  const searchesWithMatches = await Promise.all(
    searches.map(async (search) => {
      const where: Record<string, unknown> = { status: "ACTIVE" };
      if (search.area) where.property = { area: { contains: search.area, mode: "insensitive" } };
      if (search.propertyType) where.propertyType = search.propertyType;
      if (search.minPrice || search.maxPrice) {
        where.rentAmount = {};
        if (search.minPrice) (where.rentAmount as Record<string, number>).gte = search.minPrice;
        if (search.maxPrice) (where.rentAmount as Record<string, number>).lte = search.maxPrice;
      }

      const count = await prisma.listing.count({ where });
      return { ...search, matchCount: count };
    })
  );

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex items-end justify-between gap-4 pb-8 pt-10">
        <div>
          <p className="eyebrow">Student workspace</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Saved searches</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Get notified when new listings match your criteria.
          </p>
        </div>
        <Link
          className="button button-glass hidden px-4 sm:inline-flex"
          href="/search"
        >
          <Search size={17} aria-hidden="true" /> New search
        </Link>
      </header>

      <SavedSearchesList initialSearches={searchesWithMatches} />
    </div>
  );
}

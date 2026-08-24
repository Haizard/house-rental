import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CompareView } from "@/components/listings/compare-view";
import { getPublicListingById } from "@/server/listings/get-public-listings";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const { ids } = await searchParams;
  const idList = ids?.split(",").filter(Boolean).slice(0, 3) ?? [];

  const listings = (
    await Promise.all(idList.map((id) => getPublicListingById(id)))
  ).filter(Boolean) as NonNullable<Awaited<ReturnType<typeof getPublicListingById>>>[];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-10">
      <header className="mb-8 flex items-center gap-4">
        <Link
          className="button button-glass min-h-9 px-3"
          href="/search"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </Link>
        <div>
          <p className="eyebrow">Compare</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Listing Comparison
          </h1>
        </div>
      </header>

      <div className="glass-surface overflow-hidden p-4">
        <CompareView listings={listings} />
      </div>
    </div>
  );
}

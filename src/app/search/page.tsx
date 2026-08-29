import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SearchMapToggle } from "@/components/map/search-map-toggle";
import { getPublicListings } from "@/server/listings/get-public-listings";

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { area, type, minPrice, maxPrice } = await searchParams;
  const { listings } = await getPublicListings({
    area: typeof area === "string" ? area : undefined,
    type: typeof type === "string" && type !== "All homes" ? type : undefined,
    minPrice: parsePrice(minPrice),
    maxPrice: parsePrice(maxPrice),
  });
  return (
    <main className="min-h-screen px-4 py-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Link className="button button-glass mb-4 px-4" href="/">
          <ArrowLeft size={18} aria-hidden="true" />Home
        </Link>
        <div className="mb-6">
          <p className="eyebrow">Student housing in Arusha</p>
          <h1 className="mt-2 ios-page-title">Find a home</h1>
          <p className="mt-2 ios-subhead">Browse available rooms and homes before choosing an agent.</p>
        </div>
        <SearchMapToggle listings={listings} />
      </div>
    </main>
  );
}

function parsePrice(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  if (!rawValue) return undefined;
  const price = Number(rawValue);
  return Number.isInteger(price) && price >= 0 ? price : undefined;
}

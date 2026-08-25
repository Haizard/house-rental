import { ListingGridSkeleton } from "@/components/ui/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <main className="min-h-screen overflow-hidden px-4 pb-20 pt-3 sm:px-6 md:px-8 lg:px-12">
      {/* Nav skeleton */}
      <nav className="glass-nav sticky top-0 z-50 flex items-center justify-between px-4 py-3">
        <Skeleton className="h-6 w-36" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </nav>

      <section id="top" className="mx-auto max-w-7xl">
        <div className="pt-8 sm:pt-10 lg:grid lg:max-w-3xl lg:items-start lg:gap-8 lg:pt-16">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="mt-3 h-10 w-80 sm:h-12" />
          <Skeleton className="mt-3 h-5 w-96" />
          <Skeleton className="mt-6 h-12 w-full rounded-full" />
          <div className="mt-4 flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-20 rounded-full" />
            ))}
          </div>
          <Skeleton className="mt-4 h-12 w-full rounded-full" />
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-2 h-8 w-64" />
      </section>

      <section className="mx-auto mt-8 max-w-7xl">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-2 h-7 w-48" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <ListingGridSkeleton count={6} />
      </section>
    </main>
  );
}

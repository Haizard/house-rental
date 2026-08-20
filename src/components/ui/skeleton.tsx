"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[16px] bg-[var(--glass-fill)] ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
      }}
      aria-hidden="true"
    />
  );
}

export function ListingCardSkeleton() {
  return (
    <div className="listing-card">
      <Skeleton className="aspect-[4/3] rounded-b-none rounded-t-[16px]" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="listing-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ListingCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="glass-surface flex items-center gap-3 p-4">
      <Skeleton className="size-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="glass-surface flex items-center gap-4 p-4">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  );
}

export function ChatBubbleSkeleton({ own = false }: { own?: boolean }) {
  return (
    <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
      <Skeleton
        className={`h-10 rounded-[18px] ${
          own ? "w-2/5" : "w-3/5"
        }`}
      />
    </div>
  );
}

export function StatusBubbleSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <Skeleton className="size-14 rounded-full" />
      <Skeleton className="h-2.5 w-12 rounded-full" />
    </div>
  );
}

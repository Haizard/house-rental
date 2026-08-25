"use client";

import { Skeleton } from "./skeleton";

export function ListingCardSkeleton() {
  return (
    <article className="glass-surface overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </article>
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

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl pb-20 pt-10">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-10 w-64" />
      <Skeleton className="mt-2 h-5 w-80" />

      {/* Stats cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-surface p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-3 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="mt-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-surface flex gap-3 p-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SearchPageSkeleton() {
  return (
    <div className="min-h-screen px-4 py-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="mt-8 h-4 w-48" />
        <Skeleton className="mt-3 h-10 w-64" />
        <Skeleton className="mt-2 h-5 w-80" />

        {/* Map placeholder */}
        <Skeleton className="mt-8 h-[400px] w-full rounded-xl sm:h-[500px]" />

        {/* Grid */}
        <div className="listing-grid mt-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="glass-surface flex items-center gap-3 border-b border-[var(--glass-border)] p-4">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
            <Skeleton
              className={`h-10 ${i % 2 === 0 ? "w-48" : "w-56"} rounded-2xl ${
                i % 2 === 0 ? "rounded-br-sm" : "rounded-bl-sm"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="glass-surface border-t border-[var(--glass-border)] p-4">
        <div className="flex gap-2">
          <Skeleton className="h-11 flex-1 rounded-full" />
          <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-2xl pb-20 pt-10">
      <Skeleton className="h-4 w-32" />
      <div className="mt-4 flex items-center gap-4">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="mt-8 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-surface space-y-2 p-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

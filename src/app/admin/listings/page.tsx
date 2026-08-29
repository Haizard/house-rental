"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";

type Listing = {
  id: string;
  title: string;
  propertyType: string;
  status: string;
  verificationStatus: string;
  rentAmount: number;
  area: string;
  agentName: string;
  createdAt: string;
};

export default function AdminListingsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Platform administration</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Listings</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Review, approve, reject, and manage property listings.
        </p>
      </header>
      <ListingSearch />
    </div>
  );
}

function ListingSearch() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
  const [searched, setSearched] = useState(false);
  const [pending, startTransition] = useTransition();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/listings?${params}`);
      const data = await res.json().catch(() => ({ data: [] }));
      setListings(data.data ?? []);
      setSearched(true);
    });
  }

  return (
    <>
      <form className="glass-search flex flex-col gap-2 p-2 sm:flex-row" onSubmit={handleSearch}>
        <div className="flex flex-1 items-center gap-3 px-2">
          <Search className="text-[var(--accent)]" size={20} aria-hidden="true" />
          <input
            className="h-8 flex-1 bg-transparent font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or area"
            aria-label="Search listings"
          />
        </div>
        <select
          className="h-8 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-fill)] px-3 text-sm outline-none"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="PENDING_REVIEW">Pending review</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button className="button button-primary h-8 px-4 text-sm" type="submit" disabled={pending}>
          Search
        </button>
      </form>

      {searched && (
        <div className="mt-6 space-y-3">
          {listings.length === 0 ? (
            <div className="glass-surface p-6 text-sm text-[var(--text-secondary)]">
              No listings found.
            </div>
          ) : (
            listings.map((listing) => (
              <ListingRow key={listing.id} listing={listing} />
            ))
          )}
        </div>
      )}
    </>
  );
}

function ListingRow({ listing }: { listing: Listing }) {
  const [, refresh] = useState(0);
  const [pending, startTransition] = useTransition();

  async function updateStatus(newStatus: string) {
    startTransition(async () => {
      await fetch(`/api/admin/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      refresh((n) => n + 1);
    });
  }

  return (
    <article className="glass-surface grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{listing.title}</h3>
          <StatusPill status={listing.status} />
          <StatusPill status={listing.verificationStatus} />
        </div>
        <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
          {listing.propertyType} · {listing.area} · {listing.agentName}
        </p>
        <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
          TZS {listing.rentAmount.toLocaleString()} / mo ·{" "}
          {new Intl.DateTimeFormat("en-TZ", { dateStyle: "medium" }).format(new Date(listing.createdAt))}
        </p>
      </div>
      <div className="flex gap-2">
        {(listing.status === "DRAFT" || listing.status === "PAUSED") && (
          <button
            className="button button-primary h-8 px-3 text-sm"
            disabled={pending}
            type="button"
            onClick={() => updateStatus("ACTIVE")}
          >
            Activate
          </button>
        )}
        {listing.status === "ACTIVE" && (
          <>
            <button
              className="button button-glass h-8 px-3 text-sm"
              disabled={pending}
              type="button"
              onClick={() => updateStatus("PAUSED")}
            >
              Pause
            </button>
            <button
              className="button h-8 px-3 text-sm border border-[var(--danger)] bg-[var(--danger-soft)] text-[var(--danger)]"
              disabled={pending}
              type="button"
              onClick={() => updateStatus("REJECTED")}
            >
              Reject
            </button>
          </>
        )}
      </div>
    </article>
  );
}

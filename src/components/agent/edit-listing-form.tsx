"use client";

import { useRouter } from "next/navigation";
import { Pause, Play, Trash2 } from "lucide-react";
import { FormEvent, useState } from "react";

type ListingData = {
  id: string;
  title: string;
  description: string | null;
  rentAmount: number;
  rentPeriod: string;
  propertyType: string;
  status: string;
  verificationStatus: string;
  availabilityDate: string | null;
  propertyTitle: string;
  propertyArea: string;
  propertyAddress: string;
};

export function EditListingForm({ listing }: { listing: ListingData }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const body = {
      title: form.get("title"),
      description: form.get("description") || undefined,
      rentAmount: form.get("rentAmount"),
      propertyType: form.get("propertyType"),
      availabilityDate: form.get("availabilityDate") || null,
    };

    const response = await fetch(`/api/agent/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "Unable to save changes.");
    } else {
      setSuccess("Changes saved.");
    }
    setPending(false);
  }

  async function handleStatusChange(status: string) {
    setPending(true);
    setError("");
    const response = await fetch(`/api/agent/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) {
      router.refresh();
    } else {
      const result = await response.json().catch(() => null);
      setError(result?.error ?? "Unable to update.");
    }
    setPending(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this listing? This cannot be undone.")) return;
    setPending(true);
    const response = await fetch(`/api/agent/listings/${listing.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      router.push("/agent/listings");
    } else {
      const result = await response.json().catch(() => null);
      setError(result?.error ?? "Unable to delete.");
      setPending(false);
    }
  }

  const isDraft = listing.status === "DRAFT";
  const isActive = listing.status === "ACTIVE";
  const isPaused = listing.status === "PAUSED";

  return (
    <>
      {/* Status bar */}
      <div className="glass-surface mb-8 flex items-center gap-3 p-4">
        <span
          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isActive
              ? "bg-[var(--success-soft)] text-[var(--success)]"
              : isPaused
                ? "bg-[var(--warning-soft)] text-[var(--warning)]"
                : "bg-[var(--bg-base-alt)] text-[var(--text-secondary)]"
          }`}
        >
          {listing.status.replaceAll("_", " ").toLowerCase()}
        </span>
        <span className="text-xs text-[var(--text-tertiary)]">
          Verification:{" "}
          {listing.verificationStatus.replaceAll("_", " ").toLowerCase()}
        </span>
      </div>

      <form className="space-y-6" onSubmit={handleSave}>
        <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
          <GroupedRow label="Title">
            <input
              className="w-full bg-transparent text-right text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
              name="title"
              defaultValue={listing.title}
              required
            />
          </GroupedRow>
          <GroupedRow label="Property type">
            <select
              className="w-full bg-transparent text-right text-[15px] outline-none"
              name="propertyType"
              defaultValue={listing.propertyType}
              required
            >
              <option value="Self-contained">Self-contained</option>
              <option value="Private room">Private room</option>
              <option value="One bedroom">One bedroom</option>
              <option value="Single room">Single room</option>
              <option value="Studio">Studio</option>
              <option value="Apartment">Apartment</option>
            </select>
          </GroupedRow>
          <GroupedRow label="Monthly rent (TZS)">
            <input
              className="w-full bg-transparent text-right text-[15px] outline-none"
              name="rentAmount"
              type="number"
              min="1"
              defaultValue={listing.rentAmount}
              required
            />
          </GroupedRow>
          <GroupedRow label="Available from">
            <input
              className="w-full bg-transparent text-right text-[15px] outline-none"
              name="availabilityDate"
              type="date"
              defaultValue={listing.availabilityDate ?? ""}
            />
          </GroupedRow>
          <GroupedRow label="Description">
            <textarea
              className="min-h-24 w-full resize-y bg-transparent text-right text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
              name="description"
              defaultValue={listing.description ?? ""}
              placeholder="What makes this listing stand out?"
              maxLength={2000}
            />
          </GroupedRow>
        </section>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-sm text-[var(--success)]" role="status">
            {success}
          </p>
        )}

        <button
          className="button button-primary w-full px-5"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
      </form>

      {/* Actions: Publish / Pause / Delete */}
      <div className="mt-8 space-y-3">
        {(isDraft || isPaused) && (
          <button
            className="button button-primary w-full px-5"
            disabled={pending}
            type="button"
            onClick={() => handleStatusChange("ACTIVE")}
          >
            <Play size={18} aria-hidden="true" /> Publish listing
          </button>
        )}
        {isActive && (
          <button
            className="button button-glass w-full px-5"
            disabled={pending}
            type="button"
            onClick={() => handleStatusChange("PAUSED")}
          >
            <Pause size={18} aria-hidden="true" /> Pause listing
          </button>
        )}
        <button
          className="button w-full border border-[var(--danger)] bg-[var(--danger-soft)] px-5 text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white"
          disabled={pending}
          type="button"
          onClick={handleDelete}
        >
          <Trash2 size={18} aria-hidden="true" /> Delete listing
        </button>
      </div>
    </>
  );
}

function GroupedRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <span className="shrink-0 text-sm font-medium text-[var(--text-primary)]">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

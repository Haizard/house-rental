"use client";

import { useRouter } from "next/navigation";
import {
  Bed,
  DollarSign,
  Home,
  Pause,
  Play,
  Ruler,
  Shield,
  Trash2,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

const AMENITY_CATEGORIES = {
  Utilities: [
    { slug: "wifi", label: "Wi-Fi" },
    { slug: "water", label: "Water" },
    { slug: "electricity", label: "Electricity" },
    { slug: "hot-water", label: "Hot Water" },
  ],
  Features: [
    { slug: "kitchen", label: "Kitchen" },
    { slug: "parking", label: "Parking" },
    { slug: "balcony", label: "Balcony" },
    { slug: "compound", label: "Compound" },
  ],
  Security: [
    { slug: "cctv", label: "CCTV" },
    { slug: "security-guard", label: "Guard" },
    { slug: "gate", label: "Gate" },
  ],
  Convenience: [
    { slug: "laundry", label: "Laundry" },
    { slug: "shops-nearby", label: "Shops nearby" },
    { slug: "public-transport", label: "Transport" },
  ],
  Location: [
    { slug: "near-university", label: "Near university" },
    { slug: "quiet-area", label: "Quiet area" },
  ],
};

const PROPERTY_TYPES = [
  "Self-contained",
  "Private room",
  "One bedroom",
  "Single room",
  "Studio",
  "Apartment",
  "Shared room",
  "Bedsitter",
];

const LEASE_DURATIONS = [
  "Month to month",
  "3 months",
  "6 months",
  "1 year",
  "Flexible",
];

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
  // New fields
  roomSize: number | null;
  numberOfRooms: number | null;
  furnished: boolean;
  floorLevel: number | null;
  genderPreference: string;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  maxTenants: number | null;
  depositAmount: number | null;
  utilitiesIncluded: boolean;
  leaseDuration: string | null;
  amenities: string[];
};

export function EditListingForm({ listing }: { listing: ListingData }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    listing.amenities ?? [],
  );
  const [activeTab, setActiveTab] = useState<"details" | "room" | "amenities" | "rules" | "pricing">("details");

  // Sync amenities from listing prop
  useEffect(() => {
    setSelectedAmenities(listing.amenities ?? []);
  }, [listing.amenities]);

  function toggleAmenity(slug: string) {
    setSelectedAmenities((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const v = (name: string) => { const val = form.get(name); return val === null || val === "" ? undefined : val; };
    const body = {
      title: v("title") ?? listing.title,
      description: v("description"),
      rentAmount: v("rentAmount") ?? listing.rentAmount,
      propertyType: v("propertyType") ?? listing.propertyType,
      availabilityDate: v("availabilityDate") || null,
      // Room details
      roomSize: v("roomSize"),
      numberOfRooms: v("numberOfRooms"),
      furnished: form.get("furnished") === "on",
      floorLevel: v("floorLevel"),
      // Rules
      genderPreference: v("genderPreference") || "ANY",
      petsAllowed: form.get("petsAllowed") === "on",
      smokingAllowed: form.get("smokingAllowed") === "on",
      maxTenants: v("maxTenants"),
      // Pricing
      depositAmount: v("depositAmount"),
      utilitiesIncluded: form.get("utilitiesIncluded") === "on",
      leaseDuration: v("leaseDuration"),
      // Amenities
      amenities: selectedAmenities,
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
      <div className="glass-surface mb-6 flex items-center gap-3 p-4">
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

      {/* Tab navigation */}
      <div className="mb-6 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {(
          [
            { key: "details", label: "Details" },
            { key: "room", label: "Room" },
            { key: "amenities", label: "Amenities" },
            { key: "rules", label: "Rules" },
            { key: "pricing", label: "Pricing" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              activeTab === key
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-base-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
            onClick={() => setActiveTab(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <form className="space-y-6" onSubmit={handleSave} noValidate>
        {/* Tab: Details */}
        {activeTab === "details" && (
          <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
            <GroupedRow label="Title">
              <input
                className="w-full bg-transparent text-right font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
                name="title"
                defaultValue={listing.title}
                required
              />
            </GroupedRow>
            <GroupedRow label="Property type">
              <select
                className="w-full bg-transparent text-right font-t-body outline-none"
                name="propertyType"
                defaultValue={listing.propertyType}
                required
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </GroupedRow>
            <GroupedRow label="Monthly rent (TZS)">
              <input
                className="w-full bg-transparent text-right font-t-body outline-none"
                name="rentAmount"
                type="number"
                min="1"
                defaultValue={listing.rentAmount}
                required
              />
            </GroupedRow>
            <GroupedRow label="Available from">
              <input
                className="w-full bg-transparent text-right font-t-body outline-none"
                name="availabilityDate"
                type="date"
                defaultValue={listing.availabilityDate ?? ""}
              />
            </GroupedRow>
            <GroupedRow label="Description">
              <textarea
                className="min-h-24 w-full resize-y bg-transparent text-right font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
                name="description"
                defaultValue={listing.description ?? ""}
                placeholder="What makes this listing stand out?"
                maxLength={2000}
              />
            </GroupedRow>
          </section>
        )}

        {/* Tab: Room details */}
        {activeTab === "room" && (
          <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Ruler size={16} className="text-[var(--accent)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Room details
                </p>
              </div>
            </div>
            <GroupedRow label="Room size (m²)">
              <input
                className="w-full bg-transparent text-right font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
                name="roomSize"
                type="number"
                min="1"
                defaultValue={listing.roomSize ?? ""}
                placeholder="e.g. 25"
              />
            </GroupedRow>
            <GroupedRow label="Number of rooms">
              <input
                className="w-full bg-transparent text-right font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
                name="numberOfRooms"
                type="number"
                min="1"
                max="20"
                defaultValue={listing.numberOfRooms ?? ""}
                placeholder="e.g. 2"
              />
            </GroupedRow>
            <GroupedRow label="Floor level">
              <input
                className="w-full bg-transparent text-right font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
                name="floorLevel"
                type="number"
                min="0"
                max="50"
                defaultValue={listing.floorLevel ?? ""}
                placeholder="e.g. 2"
              />
            </GroupedRow>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Furnished
              </span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  className="peer sr-only"
                  name="furnished"
                  type="checkbox"
                  defaultChecked={listing.furnished}
                />
                <div className="h-6 w-11 rounded-full bg-[var(--bg-base-alt)] transition-colors peer-checked:bg-[var(--accent)]" />
                <div className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
          </section>
        )}

        {/* Tab: Amenities */}
        {activeTab === "amenities" && (
          <div className="space-y-4">
            <div className="glass-surface overflow-hidden rounded-[22px] px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Home size={16} className="text-[var(--accent)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Amenities
                </p>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Select what&apos;s included.
              </p>
            </div>
            {Object.entries(AMENITY_CATEGORIES).map(([category, items]) => (
              <div key={category}>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.map(({ slug, label }) => (
                    <button
                      key={slug}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                        selectedAmenities.includes(slug)
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                          : "border-[var(--glass-border)] bg-white/50 text-[var(--text-secondary)] hover:border-[var(--accent)]"
                      }`}
                      onClick={() => toggleAmenity(slug)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Rules */}
        {activeTab === "rules" && (
          <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-[var(--accent)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Rules & preferences
                </p>
              </div>
            </div>
            <GroupedRow label="Preferred tenant">
              <select
                className="w-full bg-transparent text-right font-t-body outline-none"
                name="genderPreference"
                defaultValue={listing.genderPreference ?? "ANY"}
              >
                <option value="ANY">Any</option>
                <option value="MALE">Male only</option>
                <option value="FEMALE">Female only</option>
              </select>
            </GroupedRow>
            <GroupedRow label="Max tenants">
              <input
                className="w-full bg-transparent text-right font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
                name="maxTenants"
                type="number"
                min="1"
                max="20"
                defaultValue={listing.maxTenants ?? ""}
                placeholder="e.g. 2"
              />
            </GroupedRow>
            <ToggleRow
              label="Pets allowed"
              name="petsAllowed"
              defaultChecked={listing.petsAllowed}
            />
            <ToggleRow
              label="Smoking allowed"
              name="smokingAllowed"
              defaultChecked={listing.smokingAllowed}
            />
          </section>
        )}

        {/* Tab: Pricing */}
        {activeTab === "pricing" && (
          <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-[var(--accent)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Pricing details
                </p>
              </div>
            </div>
            <GroupedRow label="Deposit (TZS)">
              <input
                className="w-full bg-transparent text-right font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
                name="depositAmount"
                type="number"
                min="0"
                defaultValue={listing.depositAmount ?? ""}
                placeholder="e.g. 150000"
              />
            </GroupedRow>
            <GroupedRow label="Lease duration">
              <select
                className="w-full bg-transparent text-right font-t-body outline-none"
                name="leaseDuration"
                defaultValue={listing.leaseDuration ?? ""}
              >
                <option value="">Not specified</option>
                {LEASE_DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </GroupedRow>
            <ToggleRow
              label="Utilities included"
              name="utilitiesIncluded"
              defaultChecked={listing.utilitiesIncluded}
              subtitle="Water, electricity, etc. in rent"
            />
          </section>
        )}

        {error && (
          <p
            className="rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]"
            role="alert"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            className="rounded-xl bg-[var(--success-soft)] p-3 text-sm text-[var(--success)]"
            role="status"
          >
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
      <div className="mt-8 space-y-3 pb-8">
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

function ToggleRow({
  label,
  name,
  defaultChecked,
  subtitle,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <div>
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </span>
        {subtitle && (
          <p className="text-xs text-[var(--text-tertiary)]">{subtitle}</p>
        )}
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          className="peer sr-only"
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
        />
        <div className="h-6 w-11 rounded-full bg-[var(--bg-base-alt)] transition-colors peer-checked:bg-[var(--accent)]" />
        <div className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </label>
    </div>
  );
}

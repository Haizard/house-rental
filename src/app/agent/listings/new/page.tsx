"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Camera,
  Check,
  DollarSign,
  Home,
  Info,
  Ruler,
  Shield,
  Tag,
  Upload,
} from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { AIListingExtract } from "@/components/agent/ai-listing-extract";

const STEPS = [
  { label: "Property", icon: Building2 },
  { label: "Listing", icon: Tag },
  { label: "Room", icon: Ruler },
  { label: "Amenities", icon: Home },
  { label: "Rules", icon: Shield },
  { label: "Pricing", icon: DollarSign },
  { label: "Photos", icon: Camera },
  { label: "Review", icon: Check },
];

const AMENITY_CATEGORIES = {
  Utilities: [
    { slug: "wifi", label: "📶 Wi-Fi" },
    { slug: "water", label: "💧 Water" },
    { slug: "electricity", label: "⚡ Electricity" },
    { slug: "hot-water", label: "🚿 Hot Water" },
  ],
  Features: [
    { slug: "kitchen", label: "🍳 Kitchen" },
    { slug: "parking", label: "🅿️ Parking" },
    { slug: "balcony", label: "🌅 Balcony" },
    { slug: "compound", label: "🏡 Compound" },
  ],
  Security: [
    { slug: "cctv", label: "📹 CCTV" },
    { slug: "security-guard", label: "👮 Guard" },
    { slug: "gate", label: "🚪 Gate" },
  ],
  Convenience: [
    { slug: "laundry", label: "👕 Laundry" },
    { slug: "shops-nearby", label: "🛍️ Shops" },
    { slug: "public-transport", label: "🚌 Transport" },
  ],
  Location: [
    { slug: "near-university", label: "🎓 University" },
    { slug: "quiet-area", label: "🤫 Quiet" },
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

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  function toggleAmenity(slug: string) {
    setSelectedAmenities((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }

  function handleImageSelect(files: FileList | null) {
    if (!files) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)]);
  }

  function removePendingFile(index: number) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadImagesToListing(listingId: string, files: File[]) {
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        await fetch(`/api/agent/listings/${listingId}/images`, {
          method: "POST",
          body: formData,
        });
      } catch {
        // continue with other images
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < STEPS.length - 1) {
      // Validate only visible required fields on current step
      const fields =
        event.currentTarget.querySelectorAll<HTMLElement>(
          `input[required], select[required], textarea[required]`,
        );
      for (const field of fields) {
        if (field.offsetParent === null) continue;
        const f = field as HTMLInputElement;
        if (!f.checkValidity()) {
          f.reportValidity();
          return;
        }
      }
      setStep(step + 1);
      return;
    }

    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const v = (name: string) => { const val = form.get(name); return val === null || val === "" ? undefined : val; };
    const body = {
      title: v("title"),
      description: v("description"),
      rentAmount: v("rentAmount"),
      rentPeriod: v("rentPeriod") || "MONTH",
      propertyType: v("propertyType"),
      availabilityDate: v("availabilityDate"),
      propertyTitle: v("propertyTitle"),
      propertyAddress: v("propertyAddress"),
      propertyArea: v("propertyArea"),
      propertyDescription: v("propertyDescription"),
      roomSize: v("roomSize"),
      numberOfRooms: v("numberOfRooms"),
      furnished: form.get("furnished") === "on",
      floorLevel: v("floorLevel"),
      genderPreference: v("genderPreference") || "ANY",
      petsAllowed: form.get("petsAllowed") === "on",
      smokingAllowed: form.get("smokingAllowed") === "on",
      maxTenants: v("maxTenants"),
      depositAmount: v("depositAmount"),
      utilitiesIncluded: form.get("utilitiesIncluded") === "on",
      leaseDuration: v("leaseDuration"),
      amenities: selectedAmenities,
    };

    const response = await fetch("/api/agent/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      router.push("/auth/sign-in");
      return;
    }

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "Unable to create listing.");
      setPending(false);
      return;
    }

    // Upload any pending images to the new listing
    if (pendingFiles.length > 0) {
      await uploadImagesToListing(result.data.id, pendingFiles);
    }

    router.push(`/agent/listings/${result.data.id}/edit`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link className="button button-glass mb-8 px-4" href="/agent/listings">
        <ArrowLeft size={18} aria-hidden="true" /> My listings
      </Link>

      <header className="pt-2 pb-8">
        <p className="eyebrow">New listing</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Create a listing
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Fill in the details step by step, then review before publishing.
        </p>
      </header>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide sm:justify-center sm:gap-2">
        {STEPS.map(({ label, icon: Icon }, i) => (
          <button
            key={label}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              i === step
                ? "bg-[var(--accent)] text-white"
                : i < step
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "bg-[var(--bg-base-alt)] text-[var(--text-tertiary)]"
            }`}
            onClick={() => {
              if (i <= step) setStep(i);
            }}
            type="button"
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <form
        ref={formRef}
        className="space-y-6"
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Step 0: Property details */}
        <div className={step === 0 ? "space-y-4" : "hidden"}>
          <AIListingExtract
            onExtracted={(data) => {
              const form = formRef.current;
              if (!form) return;
              const set = (name: string, value: string) => {
                const el = form.elements.namedItem(name);
                if (el && "value" in el) el.value = value;
              };
              set("propertyTitle", data.title);
              set("propertyArea", data.area);
              if (data.address) set("propertyAddress", data.address);
              set("rentAmount", String(data.rentAmount));
              set("propertyType", data.propertyType);
              if (data.description)
                set("propertyDescription", data.description);
            }}
          />
          <p className="text-center text-xs text-[var(--text-tertiary)]">
            or fill in manually
          </p>
          <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
            <GroupedRow label="Property title">
              <input
                className="w-full bg-transparent text-right text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
                name="propertyTitle"
                placeholder="e.g. Self-contained room near Tengeru"
                required
              />
            </GroupedRow>
            <GroupedRow label="Area">
              <input
                className="w-full bg-transparent text-right text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
                name="propertyArea"
                placeholder="e.g. Njiro"
                required
              />
            </GroupedRow>
            <GroupedRow label="Address">
              <input
                className="w-full bg-transparent text-right text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
                name="propertyAddress"
                placeholder="Street or landmark"
                required
              />
            </GroupedRow>
            <GroupedRow label="Description">
              <textarea
                className="min-h-20 w-full resize-y bg-transparent text-right text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
                name="propertyDescription"
                placeholder="Describe the property"
                maxLength={2000}
              />
            </GroupedRow>
          </section>
        </div>

        {/* Step 1: Listing info */}
        <div className={step === 1 ? "" : "hidden"}>
          <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
            <GroupedRow label="Listing title">
              <input
                className="w-full bg-transparent text-right text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
                name="title"
                placeholder="e.g. Bright studio with Wi-Fi"
                required
              />
            </GroupedRow>
            <GroupedRow label="Property type">
              <select
                className="w-full bg-transparent text-right text-[15px] outline-none"
                name="propertyType"
                required
              >
                <option value="">Select type</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </GroupedRow>
            <GroupedRow label="Monthly rent (TZS)">
              <input
                className="w-full bg-transparent text-right text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
                name="rentAmount"
                type="number"
                min="1"
                placeholder="150000"
                required
              />
            </GroupedRow>
            <GroupedRow label="Available from">
              <input
                className="w-full bg-transparent text-right text-[15px] outline-none"
                name="availabilityDate"
                type="date"
              />
            </GroupedRow>
            <GroupedRow label="Description">
              <textarea
                className="min-h-20 w-full resize-y bg-transparent text-right text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
                name="description"
                placeholder="What makes this listing stand out?"
                maxLength={2000}
              />
            </GroupedRow>
          </section>
        </div>

        {/* Step 2: Room details */}
        <div className={step === 2 ? "" : "hidden"}>
          <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Ruler size={16} className="text-[var(--accent)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Room details
                </p>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Help students understand the space.
              </p>
            </div>
            <GroupedRow label="Room size (m²)">
              <input
                className="w-full bg-transparent text-right text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
                name="roomSize"
                type="number"
                min="1"
                placeholder="e.g. 25"
              />
            </GroupedRow>
            <GroupedRow label="Number of rooms">
              <input
                className="w-full bg-transparent text-right text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
                name="numberOfRooms"
                type="number"
                min="1"
                max="20"
                placeholder="e.g. 2"
              />
            </GroupedRow>
            <GroupedRow label="Floor level">
              <input
                className="w-full bg-transparent text-right text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
                name="floorLevel"
                type="number"
                min="0"
                max="50"
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
                />
                <div className="h-6 w-11 rounded-full bg-[var(--bg-base-alt)] transition-colors peer-checked:bg-[var(--accent)]" />
                <div className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
          </section>
        </div>

        {/* Step 3: Amenities */}
        <div className={step === 3 ? "space-y-4" : "hidden"}>
          <div className="glass-surface overflow-hidden rounded-[22px] px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <Home size={16} className="text-[var(--accent)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Amenities
              </p>
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Select what&apos;s included. Choose all that apply.
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

        {/* Step 4: Rules & preferences */}
        <div className={step === 4 ? "" : "hidden"}>
          <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-[var(--accent)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Rules & preferences
                </p>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Set expectations for potential tenants.
              </p>
            </div>
            <GroupedRow label="Preferred tenant">
              <select
                className="w-full bg-transparent text-right text-[15px] outline-none"
                name="genderPreference"
              >
                <option value="ANY">Any</option>
                <option value="MALE">Male only</option>
                <option value="FEMALE">Female only</option>
              </select>
            </GroupedRow>
            <GroupedRow label="Max tenants">
              <input
                className="w-full bg-transparent text-right text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
                name="maxTenants"
                type="number"
                min="1"
                max="20"
                placeholder="e.g. 2"
              />
            </GroupedRow>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Pets allowed
              </span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  className="peer sr-only"
                  name="petsAllowed"
                  type="checkbox"
                />
                <div className="h-6 w-11 rounded-full bg-[var(--bg-base-alt)] transition-colors peer-checked:bg-[var(--accent)]" />
                <div className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Smoking allowed
              </span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  className="peer sr-only"
                  name="smokingAllowed"
                  type="checkbox"
                />
                <div className="h-6 w-11 rounded-full bg-[var(--bg-base-alt)] transition-colors peer-checked:bg-[var(--accent)]" />
                <div className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
          </section>
        </div>

        {/* Step 5: Pricing details */}
        <div className={step === 5 ? "" : "hidden"}>
          <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
            <div className="px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-[var(--accent)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Pricing details
                </p>
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Be transparent about costs.
              </p>
            </div>
            <GroupedRow label="Deposit (TZS)">
              <input
                className="w-full bg-transparent text-right text-[15px] outline-none placeholder:text-[var(--text-tertiary)]"
                name="depositAmount"
                type="number"
                min="0"
                placeholder="e.g. 150000"
              />
            </GroupedRow>
            <GroupedRow label="Lease duration">
              <select
                className="w-full bg-transparent text-right text-[15px] outline-none"
                name="leaseDuration"
              >
                <option value="">Not specified</option>
                {LEASE_DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </GroupedRow>
            <div className="flex items-center justify-between px-5 py-3.5">
              <div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Utilities included
                </span>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Water, electricity, etc. in rent
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  className="peer sr-only"
                  name="utilitiesIncluded"
                  type="checkbox"
                />
                <div className="h-6 w-11 rounded-full bg-[var(--bg-base-alt)] transition-colors peer-checked:bg-[var(--accent)]" />
                <div className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
          </section>
        </div>

        {/* Step 6: Photos */}
        <div className={step === 6 ? "space-y-4" : "hidden"}>
          <div className="glass-surface overflow-hidden rounded-[22px] px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <Camera size={16} className="text-[var(--accent)]" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Photos
              </p>
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Listings with photos get 3x more views. You can also add photos
              later from the edit page.
            </p>
          </div>
          <label className="glass-surface flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[22px] border-2 border-dashed border-[var(--glass-border)] p-8 transition hover:border-[var(--accent)]">
            <Upload size={32} className="text-[var(--text-tertiary)]" />
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Tap to add photos
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                JPEG, PNG, WebP · Max 5MB each
              </p>
            </div>
            <input
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              multiple
              onChange={(e) => handleImageSelect(e.target.files)}
              type="file"
            />
          </label>
          {pendingFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {pendingFiles.map((file, idx) => (
                <div
                  className="group relative aspect-square overflow-hidden rounded-xl"
                  key={`${file.name}-${idx}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={`Photo ${idx + 1}`}
                    className="h-full w-full object-cover"
                    src={URL.createObjectURL(file)}
                  />
                  {idx === 0 && (
                    <span className="absolute left-1 top-1 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[9px] font-bold text-white">
                      PRIMARY
                    </span>
                  )}
                  <button
                    className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition hover:bg-red-500"
                    onClick={() => removePendingFile(idx)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <Info size={12} /> First photo becomes the primary image shown in
            search results.
          </p>
        </div>

        {/* Step 7: Review */}
        <div className={step === 7 ? "" : "hidden"}>
          <section className="glass-surface overflow-hidden rounded-[22px]">
            <div className="p-5">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-[var(--accent)]" />
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Review your listing
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Your listing will be saved as a <strong>Draft</strong>. You can
                edit it and publish when ready.
              </p>
            </div>
            <div className="border-t border-[var(--glass-border)] p-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">
                    Amenities selected
                  </span>
                  <span className="font-medium">
                    {selectedAmenities.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Photos</span>
                  <span className="font-medium">{pendingFiles.length}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {error && (
          <p
            className="rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3 pb-8">
          {step > 0 && (
            <button
              className="button button-glass flex-1 px-5"
              type="button"
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          )}
          <button
            className="button button-primary flex-1 px-5"
            disabled={pending}
            type="submit"
          >
            {pending
              ? "Creating..."
              : step < STEPS.length - 1
                ? "Continue"
                : "Create listing"}
          </button>
        </div>
      </form>
    </div>
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

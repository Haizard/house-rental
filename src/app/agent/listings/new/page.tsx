"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { AIListingExtract } from "@/components/agent/ai-listing-extract";

const STEPS = ["Property details", "Listing info", "Review"];

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < STEPS.length - 1) {
      // Validate only the current step's visible required fields
      const fields = event.currentTarget.querySelectorAll<HTMLElement>(
        `input[required], select[required], textarea[required]`
      );
      for (const field of fields) {
        if (field.offsetParent === null) continue; // skip hidden fields
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
    const body = {
      title: form.get("title"),
      description: form.get("description") || undefined,
      rentAmount: form.get("rentAmount"),
      rentPeriod: form.get("rentPeriod") || "MONTH",
      propertyType: form.get("propertyType"),
      availabilityDate: form.get("availabilityDate") || undefined,
      propertyTitle: form.get("propertyTitle"),
      propertyAddress: form.get("propertyAddress"),
      propertyArea: form.get("propertyArea"),
      propertyDescription: form.get("propertyDescription") || undefined,
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

    router.push(`/agent/listings/${result.data.id}/edit`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        className="button button-glass mb-8 px-4"
        href="/agent/listings"
      >
        <ArrowLeft size={18} aria-hidden="true" /> My listings
      </Link>

      <header className="pt-2 pb-8">
        <p className="eyebrow">New listing</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Create a listing
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Add your property details, then review before publishing.
        </p>
      </header>

      {/* Step indicator — iOS-style dots */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className="flex items-center gap-2 text-xs font-medium"
          >
            <span
              className={`flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                i <= step
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-base-alt)] text-[var(--text-tertiary)]"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`hidden sm:inline ${
                i === step ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
              }`}
            >
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 hidden h-px w-6 bg-[var(--glass-border)] sm:block" />
            )}
          </span>
        ))}
      </div>

      <form ref={formRef} className="space-y-6" onSubmit={handleSubmit} noValidate>
        {/* Step 1: Property details */}
        <div className={step === 0 ? "" : "hidden"}>
          {/* AI extraction option */}
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
              if (data.description) set("propertyDescription", data.description);
            }}
          />
          <p className="text-center text-xs text-[var(--text-tertiary)]">or fill in manually</p>
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

        {/* Step 2: Listing info */}
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

        {/* Step 3: Review */}
        <div className={step === 2 ? "" : "hidden"}>
          <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
            <div className="p-5">
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Review your listing
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Your listing will be saved as a <strong>Draft</strong>. You can
                edit it and publish when ready.
              </p>
            </div>
          </section>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3">
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

"use client";

import { BadgeCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { StatusPill } from "@/components/ui/status-pill";

type ProfileData = {
  businessName: string;
  bio: string;
  photoUrl: string | null;
  firstName: string;
  lastName: string;
  email: string;
  verification: string;
  rating: number;
  totalReviews: number;
};

export function AgentProfileForm({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    setSuccess("");

    const form = new FormData(e.currentTarget);
    const body = {
      businessName: form.get("businessName"),
      bio: form.get("bio") || undefined,
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
    };

    const res = await fetch("/api/agent/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await res.json().catch(() => null);
    if (!res.ok) {
      setError(result?.error ?? "Unable to save profile.");
    } else {
      setSuccess("Profile saved.");
      router.refresh();
    }
    setPending(false);
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Public profile summary */}
      <div className="glass-surface flex items-center gap-4 p-5">
        <span className="flex size-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xl font-bold">
          {profile.businessName.charAt(0) || "?"}
        </span>
        <div>
          <h2 className="font-semibold">{profile.businessName || "Your business"}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StatusPill status={profile.verification} />
            {profile.rating > 0 && (
              <span className="text-sm text-[var(--text-secondary)]">
                ★ {profile.rating.toFixed(1)} ({profile.totalReviews} reviews)
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
        <GroupedRow label="Business name">
          <input
            className="w-full bg-transparent text-right font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
            name="businessName"
            defaultValue={profile.businessName}
            placeholder="e.g. Mwanaisha Homes"
            required
          />
        </GroupedRow>
        <GroupedRow label="Bio">
          <textarea
            className="min-h-24 w-full resize-y bg-transparent text-right font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
            name="bio"
            defaultValue={profile.bio}
            placeholder="Tell students about your areas and specialties"
            maxLength={500}
          />
        </GroupedRow>
      </section>

      <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
        <GroupedRow label="First name">
          <input
            className="w-full bg-transparent text-right font-t-body outline-none"
            name="firstName"
            defaultValue={profile.firstName}
            required
          />
        </GroupedRow>
        <GroupedRow label="Last name">
          <input
            className="w-full bg-transparent text-right font-t-body outline-none"
            name="lastName"
            defaultValue={profile.lastName}
            required
          />
        </GroupedRow>
        <GroupedRow label="Email">
          <span className="text-sm text-[var(--text-secondary)]">
            {profile.email}
          </span>
        </GroupedRow>
      </section>

      {error && (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-[var(--success)]" role="status">
          {success}
        </p>
      )}

      <button
        className="button button-primary w-full"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving..." : "Save profile"}
      </button>
    </form>
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

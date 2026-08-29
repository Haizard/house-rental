"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type ProfileData = {
  firstName: string;
  lastName: string;
  email: string;
  universityId: string | null;
  universityName: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  preferredArea: string | null;
  moveInDate: string | null;
  roomType: string | null;
};

type University = { id: string; name: string };

const roomTypes = [
  "Self-contained",
  "Private room",
  "One bedroom",
  "Single room",
  "Studio",
  "Apartment",
  "Any",
];

export function StudentProfileForm({
  profile,
  universities,
}: {
  profile: ProfileData;
  universities: University[];
}) {
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
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      universityId: form.get("universityId") || null,
      budgetMin: form.get("budgetMin") ? Number(form.get("budgetMin")) : null,
      budgetMax: form.get("budgetMax") ? Number(form.get("budgetMax")) : null,
      preferredArea: form.get("preferredArea") || null,
      moveInDate: form.get("moveInDate") || null,
      roomType: form.get("roomType") || null,
    };

    const res = await fetch("/api/student/profile", {
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

      <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
        <GroupedRow label="University">
          <select
            className="w-full bg-transparent text-right font-t-body outline-none"
            name="universityId"
            defaultValue={profile.universityId ?? ""}
          >
            <option value="">None selected</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </GroupedRow>
        <GroupedRow label="Preferred area">
          <input
            className="w-full bg-transparent text-right font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
            name="preferredArea"
            defaultValue={profile.preferredArea ?? ""}
            placeholder="e.g. Njiro"
          />
        </GroupedRow>
        <GroupedRow label="Room type">
          <select
            className="w-full bg-transparent text-right font-t-body outline-none"
            name="roomType"
            defaultValue={profile.roomType ?? ""}
          >
            <option value="">Any</option>
            {roomTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </GroupedRow>
        <GroupedRow label="Move-in date">
          <input
            className="w-full bg-transparent text-right font-t-body outline-none"
            name="moveInDate"
            type="date"
            defaultValue={profile.moveInDate ?? ""}
          />
        </GroupedRow>
      </section>

      <section className="glass-surface divide-y divide-black/[.06] overflow-hidden rounded-[22px]">
        <GroupedRow label="Budget min (TZS)">
          <input
            className="w-full bg-transparent text-right font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
            name="budgetMin"
            type="number"
            min="0"
            defaultValue={profile.budgetMin ?? ""}
            placeholder="100000"
          />
        </GroupedRow>
        <GroupedRow label="Budget max (TZS)">
          <input
            className="w-full bg-transparent text-right font-t-body outline-none placeholder:text-[var(--text-tertiary)]"
            name="budgetMax"
            type="number"
            min="0"
            defaultValue={profile.budgetMax ?? ""}
            placeholder="200000"
          />
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

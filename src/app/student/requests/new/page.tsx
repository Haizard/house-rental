"use client";

import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PROPERTY_TYPES = ["Self-contained", "Single Room", "Double Room", "Shared Room", "Studio", "Hostel"];
const ROOM_TYPES = ["Furnished", "Unfurnished", "Semi-furnished"];
const COMMON_AMENITIES = ["Wi-Fi", "Water", "Electricity", "Parking", "Security", "Laundry", "Kitchen", "Balcony", "Air Conditioning", "Furnished"];

export default function NewRoomRequestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);

  function toggleAmenity(a: string) {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const body = {
      title: form.get("title"),
      description: form.get("description"),
      area: form.get("area"),
      propertyType: form.get("propertyType"),
      rentMin: form.get("rentMin") ? Number(form.get("rentMin")) : null,
      rentMax: form.get("rentMax") ? Number(form.get("rentMax")) : null,
      roomType: form.get("roomType"),
      moveInDate: form.get("moveInDate") || null,
      amenities,
    };

    const res = await fetch("/api/student/room-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/student/requests");
    } else {
      const err = await res.json();
      alert(err.error || "Failed to create request");
    }
    setSubmitting(false);
  }

  return (
    <main className="min-h-screen px-4 py-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-2xl">
        <Link className="button button-glass mb-6 px-4" href="/student/requests">
          <ArrowLeft size={18} /> My Requests
        </Link>

        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Post a Room Request
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Describe your ideal room and agents will compete to offer you the best match.
        </p>

        <form className="glass-surface mt-6 space-y-5 p-5 sm:p-7" onSubmit={handleSubmit}>
          {/* Title */}
          <div>
            <label className="eyebrow" htmlFor="title">What are you looking for?</label>
            <input
              id="title"
              name="title"
              required
              minLength={5}
              placeholder="e.g. Self-contained near Arusha Technical College"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="eyebrow" htmlFor="description">Additional details</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Any specific requirements, preferences, or notes for agents..."
              className="mt-2 w-full rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Area */}
          <div>
            <label className="eyebrow" htmlFor="area">Preferred area / neighborhood</label>
            <input
              id="area"
              name="area"
              required
              placeholder="e.g. Njiro, Tengeru, Kinondoni"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Property type + Room type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="eyebrow" htmlFor="propertyType">Property type</label>
              <select
                id="propertyType"
                name="propertyType"
                required
                className="mt-2 w-full rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)]"
              >
                <option value="">Any</option>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow" htmlFor="roomType">Furnishing</label>
              <select
                id="roomType"
                name="roomType"
                className="mt-2 w-full rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)]"
              >
                <option value="">Any</option>
                {ROOM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget range */}
          <div>
            <label className="eyebrow">Monthly budget (TZS)</label>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <input
                name="rentMin"
                type="number"
                min={0}
                placeholder="Min (e.g. 100000)"
                className="w-full rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)]"
              />
              <input
                name="rentMax"
                type="number"
                min={0}
                placeholder="Max (e.g. 200000)"
                className="w-full rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          {/* Move-in date */}
          <div>
            <label className="eyebrow" htmlFor="moveInDate">Preferred move-in date</label>
            <input
              id="moveInDate"
              name="moveInDate"
              type="date"
              className="mt-2 w-full rounded-xl border border-black/10 bg-white/60 px-4 py-3 text-[15px] outline-none focus:border-[var(--accent)]"
            />
          </div>

          {/* Amenities */}
          <div>
            <label className="eyebrow">Desired amenities</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {COMMON_AMENITIES.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    amenities.includes(a)
                      ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                      : "border-black/10 bg-white/60 text-[var(--text-secondary)] hover:border-[var(--accent)]"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            className="button button-primary w-full"
            type="submit"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin" size={16} /> Posting request...
              </span>
            ) : (
              "Post Room Request"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

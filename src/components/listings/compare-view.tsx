"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type CompareListing = {
  id: string;
  title: string;
  type: string;
  area: string;
  price: number;
  image: string;
  verified: boolean;
  roomSize?: number | null;
  numberOfRooms?: number | null;
  furnished?: boolean;
  floorLevel?: number | null;
  genderPreference?: string;
  petsAllowed?: boolean;
  smokingAllowed?: boolean;
  maxTenants?: number | null;
  depositAmount?: number | null;
  utilitiesIncluded?: boolean;
  leaseDuration?: string | null;
  amenities?: { name: string; slug: string }[];
};

interface CompareViewProps {
  listings: CompareListing[];
}

const ROWS: { label: string; key: string; format?: (val: unknown) => string }[] = [
  { label: "Type", key: "type" },
  { label: "Area", key: "area" },
  { label: "Price", key: "price", format: (v) => `TZS ${Number(v).toLocaleString()}/mo` },
  { label: "Room size", key: "roomSize", format: (v) => v ? `${v} m²` : "—" },
  { label: "Rooms", key: "numberOfRooms", format: (v) => v ? String(v) : "—" },
  { label: "Floor", key: "floorLevel", format: (v) => v ? String(v) : "—" },
  { label: "Furnished", key: "furnished", format: (v) => v ? "Yes" : "No" },
  { label: "Gender", key: "genderPreference", format: (v) => v === "ANY" ? "Any" : v === "MALE" ? "Male" : v === "FEMALE" ? "Female" : "—" },
  { label: "Pets", key: "petsAllowed", format: (v) => v ? "Yes" : "No" },
  { label: "Smoking", key: "smokingAllowed", format: (v) => v ? "Yes" : "No" },
  { label: "Max tenants", key: "maxTenants", format: (v) => v ? String(v) : "—" },
  { label: "Deposit", key: "depositAmount", format: (v) => v ? `TZS ${Number(v).toLocaleString()}` : "—" },
  { label: "Utilities", key: "utilitiesIncluded", format: (v) => v ? "Included" : "Not included" },
  { label: "Lease", key: "leaseDuration", format: (v) => v ? String(v) : "—" },
  { label: "Amenities", key: "amenities", format: (v) => (v as { name: string }[])?.map((a) => a.name).join(", ") || "—" },
];

export function CompareView({ listings }: CompareViewProps) {
  if (listings.length < 2) {
    return (
      <div className="glass-surface flex min-h-64 flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-semibold">Select at least 2 listings to compare</p>
        <Link className="button button-glass mt-4 px-4" href="/search">
          <ArrowLeft size={16} /> Browse listings
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[400px] border-collapse">
        {/* Header: images + titles */}
        <thead>
          <tr>
            <th className="w-[120px] p-2 text-left text-xs font-semibold text-[var(--text-tertiary)]">
              Feature
            </th>
            {listings.map((l) => (
              <th className="p-2 text-center" key={l.id}>
                <Link className="block" href={`/listings/${l.id}`}>
                  <div className="relative mx-auto mb-2 aspect-[4/3] w-full max-w-[140px] overflow-hidden rounded-xl">
                    <Image
                      src={l.image}
                      alt={l.title}
                      fill
                      className="object-cover"
                      sizes="140px"
                    />
                  </div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-1">
                    {l.title}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {l.area}
                  </p>
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, idx) => (
            <tr
              className={idx % 2 === 0 ? "bg-[var(--accent-soft)]/30" : ""}
              key={row.key}
            >
              <td className="px-3 py-2.5 text-xs font-medium text-[var(--text-secondary)]">
                {row.label}
              </td>
              {listings.map((l) => {
                const raw = (l as Record<string, unknown>)[row.key];
                const display = row.format ? row.format(raw) : String(raw ?? "—");
                // Highlight best value for price
                const isBest =
                  row.key === "price" &&
                  listings.every((other) => Number(other.price) >= Number(l.price));
                return (
                  <td
                    className={`px-3 py-2.5 text-center text-sm ${
                      isBest ? "font-bold text-emerald-600" : "text-[var(--text-primary)]"
                    }`}
                    key={l.id}
                  >
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

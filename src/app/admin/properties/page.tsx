import { Building2 } from "lucide-react";
import { prisma } from "@/lib/db/prisma";

export default async function AdminPropertiesPage() {
  const properties = await prisma.property.findMany({
    include: {
      listings: { select: { id: true, status: true } },
      agents: {
        include: { agent: { select: { businessName: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Platform administration</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Properties</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Physical properties and their associated listings and agents.
        </p>
      </header>

      <div className="space-y-3">
        {properties.length === 0 ? (
          <div className="glass-surface p-8 text-center">
            <Building2 className="mx-auto text-[var(--text-tertiary)]" size={28} aria-hidden="true" />
            <h2 className="mt-3 font-semibold">No properties yet</h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Properties are created when agents publish listings.
            </p>
          </div>
        ) : (
          properties.map((property) => {
            const activeCount = property.listings.filter(
              (l) => l.status === "ACTIVE",
            ).length;
            return (
              <article
                className="glass-surface flex items-center gap-4 p-4"
                key={property.id}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Building2 size={18} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold">{property.title}</h3>
                  <p className="mt-0.5 text-sm text-[var(--text-secondary)]">
                    {property.area} · {property.address}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
                    {property.listings.length} listings ({activeCount} active) ·{" "}
                    {property.agents
                      .map((pa) => pa.agent.businessName)
                      .join(", ") || "No agents"}
                  </p>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

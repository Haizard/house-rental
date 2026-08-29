import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Bed,
  CalendarDays,
  DollarSign,
  Home,
  MapPin,
  PawPrint,
  Ruler,
  ShieldCheck,
  Users,
  Cigarette,
} from "lucide-react";
import { notFound } from "next/navigation";
import { LeadIntake } from "@/components/listings/lead-intake";
import { ViewingRequest } from "@/components/listings/viewing-request";
import { ReportForm } from "@/components/reports/report-form";
import { ListingGallery } from "@/components/listings/listing-gallery";
import { getPublicListingById } from "@/server/listings/get-public-listings";

export default async function ListingDetailPage({
  params,
}: PageProps<"/listings/[id]">) {
  const { id } = await params;
  const listing = await getPublicListingById(id);
  if (!listing) notFound();

  const price = new Intl.NumberFormat("en-TZ").format(listing.price);
  const hasDetails =
    listing.roomSize ||
    listing.numberOfRooms ||
    listing.furnished ||
    listing.genderPreference !== "ANY" ||
    listing.depositAmount ||
    listing.leaseDuration;

  return (
    <main className="min-h-screen px-4 py-4 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <Link className="button button-glass mb-6 px-4" href="/">
          <ArrowLeft size={18} aria-hidden="true" /> All homes
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          {/* Left: Image + Details */}
          <section className="overflow-hidden rounded-[22px] border glass-surface">
            <ListingGallery
              images={(listing.images ?? []).map((img) => ({
                id: img.id,
                url: img.url,
              }))}
              title={listing.title}
            />

            <div className="p-5 sm:p-7">
              <p className="eyebrow">Available in {listing.area}</p>
              <h1 className="mt-2 font-t-headline text-[var(--text-primary)]">
                {listing.title}
              </h1>

              {/* Basic info */}
              <div className="mt-5 grid gap-3 border-t border-black/[.07] pt-5 font-t-body text-[var(--text-secondary)] sm:grid-cols-2">
                <p className="flex items-center gap-2">
                  <MapPin
                    className="text-[var(--accent)]"
                    size={18}
                    aria-hidden="true"
                  />
                  {listing.area}, Arusha
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays
                    className="text-[var(--accent)]"
                    size={18}
                    aria-hidden="true"
                  />
                  Ready to arrange a viewing
                </p>
              </div>

              {/* Room details */}
              {(listing.roomSize ||
                listing.numberOfRooms ||
                listing.floorLevel != null ||
                listing.furnished) && (
                <div className="mt-5 border-t border-black/[.07] pt-5">
                  <div className="flex items-center gap-2">
                    <Ruler
                      size={16}
                      className="text-[var(--accent)]"
                      aria-hidden="true"
                    />
                    <h2 className="ios-headline">
                      Room details
                    </h2>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {listing.roomSize && (
                      <span className="rounded-full bg-[var(--bg-base-alt)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                        📐 {listing.roomSize} m²
                      </span>
                    )}
                    {listing.numberOfRooms && (
                      <span className="rounded-full bg-[var(--bg-base-alt)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                        {listing.numberOfRooms} room
                        {listing.numberOfRooms > 1 ? "s" : ""}
                      </span>
                    )}
                    {listing.floorLevel != null && (
                      <span className="rounded-full bg-[var(--bg-base-alt)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                        Floor {listing.floorLevel}
                      </span>
                    )}
                    {listing.furnished && (
                      <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                        Furnished
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {listing.amenities && listing.amenities.length > 0 && (
                <div className="mt-5 border-t border-black/[.07] pt-5">
                  <div className="flex items-center gap-2">
                    <Home
                      size={16}
                      className="text-[var(--accent)]"
                      aria-hidden="true"
                    />
                    <h2 className="ios-headline">
                      What&apos;s included
                    </h2>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {listing.amenities.map((a) => (
                      <span
                        className="rounded-full border border-[var(--accent)]/15 bg-[var(--accent)]/8 px-3 py-1 text-xs font-medium text-[var(--accent)]"
                        key={a.slug}
                      >
                        {a.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rules & preferences */}
              {hasDetails && (
                <div className="mt-5 border-t border-black/[.07] pt-5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      size={16}
                      className="text-[var(--accent)]"
                      aria-hidden="true"
                    />
                    <h2 className="ios-headline">
                      Rules & preferences
                    </h2>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {listing.genderPreference &&
                      listing.genderPreference !== "ANY" && (
                        <span className="flex items-center gap-1 rounded-full bg-[var(--bg-base-alt)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                          <Users size={12} />{" "}
                          {listing.genderPreference === "MALE"
                            ? "Male tenants"
                            : "Female tenants"}
                        </span>
                      )}
                    {listing.genderPreference === "ANY" && (
                      <span className="flex items-center gap-1 rounded-full bg-[var(--bg-base-alt)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                        <Users size={12} /> Any tenant
                      </span>
                    )}
                    {listing.maxTenants && (
                      <span className="rounded-full bg-[var(--bg-base-alt)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                        👥 Max {listing.maxTenants}
                      </span>
                    )}
                    {listing.petsAllowed && (
                      <span className="flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                        <PawPrint size={12} /> Pets OK
                      </span>
                    )}
                    {listing.smokingAllowed && (
                      <span className="flex items-center gap-1 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                        <Cigarette size={12} /> Smoking OK
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Right sidebar: Price + Actions */}
          <aside className="glass-surface h-fit p-5 sm:p-6">
            <p className="price mt-0 text-3xl">
              TZS {price}
              <span className="text-sm font-normal text-[var(--text-secondary)]">
                {" "}
                / month
              </span>
            </p>
            <p className="mt-2 font-t-body text-[var(--text-secondary)]">
              {listing.type} in {listing.area}
            </p>

            {/* Pricing details */}
            {(listing.depositAmount ||
              listing.leaseDuration ||
              listing.utilitiesIncluded) && (
              <div className="mt-4 space-y-1.5 border-t border-[var(--glass-border)] pt-4">
                {listing.depositAmount && (
                  <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <DollarSign size={14} className="text-[var(--accent)]" />
                    Deposit: TZS{" "}
                    {new Intl.NumberFormat("en-TZ").format(
                      listing.depositAmount,
                    )}
                  </p>
                )}
                {listing.leaseDuration && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Lease: {listing.leaseDuration}
                  </p>
                )}
                {listing.utilitiesIncluded && (
                  <p className="text-sm font-medium text-[var(--success)]">
                    Utilities included in rent
                  </p>
                )}
              </div>
            )}

            {listing.verified && (
              <p className="mt-5 flex items-center gap-2 text-sm font-medium text-[var(--success)]">
                <BadgeCheck size={18} aria-hidden="true" />
                Verified listing
              </p>
            )}

            <Link
              className="mt-5 block text-sm font-medium text-[var(--accent)]"
              href={`/agents/${listing.agentId}`}
            >
              View agent profile
            </Link>

            <div className="mt-6 space-y-3">
              <LeadIntake listingId={listing.id} />
              <ViewingRequest listingId={listing.id} />
              <ReportForm targetType="LISTING" targetId={listing.id} />
            </div>

            <div className="mt-6 border-t border-[var(--glass-border)] pt-5">
              <p className="flex items-start gap-3 text-sm leading-5 text-[var(--text-secondary)]">
                <ShieldCheck
                  className="mt-0.5 shrink-0 text-[var(--accent)]"
                  size={19}
                  aria-hidden="true"
                />
                You choose the agent before opening a conversation. No fee is
                charged to students.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

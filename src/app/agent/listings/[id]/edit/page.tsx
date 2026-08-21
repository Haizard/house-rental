import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/db/prisma";
import { EditListingForm } from "@/components/agent/edit-listing-form";
import { ImageUpload } from "@/components/agent/image-upload";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("AGENT");
  const { id } = await params;

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent) notFound();

  const listing = await prisma.listing.findFirst({
    where: { id, agentId: agent.id },
    include: {
      property: { select: { area: true, title: true, address: true } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!listing) notFound();

  const listingData = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    rentAmount: listing.rentAmount,
    rentPeriod: listing.rentPeriod,
    propertyType: listing.propertyType,
    status: listing.status,
    verificationStatus: listing.verificationStatus,
    availabilityDate:
      listing.availabilityDate?.toISOString().split("T")[0] ?? null,
    propertyTitle: listing.property.title,
    propertyArea: listing.property.area,
    propertyAddress: listing.property.address,
    // New fields
    roomSize: listing.roomSize,
    numberOfRooms: listing.numberOfRooms,
    furnished: listing.furnished,
    floorLevel: listing.floorLevel,
    genderPreference: listing.genderPreference,
    petsAllowed: listing.petsAllowed,
    smokingAllowed: listing.smokingAllowed,
    maxTenants: listing.maxTenants,
    depositAmount: listing.depositAmount,
    utilitiesIncluded: listing.utilitiesIncluded,
    leaseDuration: listing.leaseDuration,
    amenities: [] as string[],
  };

  // Fetch amenities for this listing
  const amenities = await prisma.listingAmenity.findMany({
    where: { listingId: listing.id },
    include: { amenity: { select: { slug: true } } },
  });
  listingData.amenities = amenities.map((a) => a.amenity.slug);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        className="button button-glass mb-8 px-4"
        href="/agent/listings"
      >
        <ArrowLeft size={18} aria-hidden="true" /> My listings
      </Link>
      <header className="pb-8 pt-2">
        <p className="eyebrow">Edit listing</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          {listing.title}
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          {listing.propertyType} · {listing.property.area}
        </p>
      </header>
      <EditListingForm listing={listingData} />

      {/* Photos section */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">Photos</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Add photos so students can see the space before requesting a viewing.
        </p>
        <div className="mt-4">
          <ImageUpload
            listingId={listing.id}
            existingImages={listing.images.map((img) => ({
              id: img.id,
              url: img.url,
              sortOrder: img.sortOrder,
              isPrimary: img.isPrimary,
            }))}
          />
        </div>
      </section>


    </div>
  );
}

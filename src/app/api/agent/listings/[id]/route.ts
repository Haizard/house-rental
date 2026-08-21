import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

const updateSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(2000).optional(),
  rentAmount: z.coerce.number().int().positive().optional(),
  rentPeriod: z.enum(["MONTH", "WEEK", "DAY"]).optional(),
  propertyType: z.string().trim().min(1).optional(),
  availabilityDate: z.string().date().optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED"]).optional(),
  // Room details
  roomSize: z.coerce.number().int().positive().optional().nullable(),
  numberOfRooms: z.coerce.number().int().positive().optional().nullable(),
  furnished: z.boolean().optional(),
  floorLevel: z.coerce.number().int().min(0).optional().nullable(),
  // Rules & preferences
  genderPreference: z.enum(["ANY", "MALE", "FEMALE"]).optional(),
  petsAllowed: z.boolean().optional(),
  smokingAllowed: z.boolean().optional(),
  maxTenants: z.coerce.number().int().positive().optional().nullable(),
  // Pricing details
  depositAmount: z.coerce.number().int().min(0).optional().nullable(),
  utilitiesIncluded: z.boolean().optional(),
  leaseDuration: z.string().trim().max(50).optional().nullable(),
  // Amenities
  amenities: z.array(z.string()).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents can update listings." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id, agentId: agent.id },
    select: { id: true, status: true },
  });
  if (!listing)
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const raw = await request.json().catch(() => null);
  // Strip null and empty-string values — Zod optional() rejects null but accepts undefined
  const cleaned = raw && typeof raw === "object"
    ? Object.fromEntries(Object.entries(raw).filter(([, v]) => v !== null && v !== ""))
    : raw;
  const parsed = updateSchema.safeParse(cleaned);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: issues }, { status: 400 });
  }

  const d = parsed.data;

  // Separate amenities from listing fields
  const { amenities, ...listingFields } = parsed.data;

  // When transitioning to ACTIVE, set publishedAt
  const data: Record<string, unknown> = { ...listingFields };

  // Convert date-only string to full ISO DateTime for Prisma
  if (data.availabilityDate && typeof data.availabilityDate === "string") {
    data.availabilityDate = new Date(data.availabilityDate as string);
  }
  if (d.status === "ACTIVE" && listing.status !== "ACTIVE") {
    data.publishedAt = new Date();
    data.verificationStatus = "UNVERIFIED";
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.listing.update({
      where: { id: listing.id },
      data,
      select: { id: true, status: true, verificationStatus: true },
    });

    // Update amenities if provided
    if (amenities !== undefined) {
      // Remove existing
      await tx.listingAmenity.deleteMany({ where: { listingId: listing.id } });
      // Add new
      if (amenities.length > 0) {
        const amenityRecords = await tx.amenity.findMany({
          where: { slug: { in: amenities } },
          select: { id: true },
        });
        if (amenityRecords.length > 0) {
          await tx.listingAmenity.createMany({
            data: amenityRecords.map((a) => ({
              listingId: listing.id,
              amenityId: a.id,
            })),
          });
        }
      }
    }

    return result;
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents can delete listings." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const { id } = await params;
  const listing = await prisma.listing.findFirst({
    where: { id, agentId: agent.id },
    select: { id: true },
  });
  if (!listing)
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  await prisma.listing.delete({ where: { id: listing.id } });
  return NextResponse.json({ deleted: true });
}

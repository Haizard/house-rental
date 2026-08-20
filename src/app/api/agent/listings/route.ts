import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

const createListingSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(2000).optional(),
  rentAmount: z.coerce.number().int().positive(),
  rentPeriod: z.enum(["MONTH", "WEEK", "DAY"]).default("MONTH"),
  propertyType: z.string().trim().min(1),
  availabilityDate: z.string().date().optional(),
  propertyTitle: z.string().trim().min(1).max(200),
  propertyAddress: z.string().trim().min(1).max(300),
  propertyArea: z.string().trim().min(1).max(100),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  propertyDescription: z.string().trim().max(2000).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents can access this." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const listings = await prisma.listing.findMany({
    where: { agentId: agent.id },
    include: {
      property: { select: { area: true, title: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      rentAmount: listing.rentAmount,
      rentPeriod: listing.rentPeriod,
      propertyType: listing.propertyType,
      status: listing.status,
      verificationStatus: listing.verificationStatus,
      area: listing.property.area,
      image: listing.images[0]?.url ?? null,
      createdAt: listing.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents can create listings." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, verification: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const parsed = createListingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: issues }, { status: 400 });
  }

  const d = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    // Create or find the property
    const property = await tx.property.create({
      data: {
        title: d.propertyTitle,
        propertyType: d.propertyType,
        address: d.propertyAddress,
        area: d.propertyArea,
        latitude: d.latitude ?? null,
        longitude: d.longitude ?? null,
        description: d.propertyDescription ?? null,
      },
    });

    // Link agent to property
    await tx.propertyAgent.create({
      data: {
        propertyId: property.id,
        agentId: agent.id,
        relationshipType: "AGENT",
      },
    });

    // Create the listing — DRAFT so agent can review before publishing
    const listing = await tx.listing.create({
      data: {
        propertyId: property.id,
        agentId: agent.id,
        title: d.title,
        description: d.description ?? null,
        rentAmount: d.rentAmount,
        rentPeriod: d.rentPeriod,
        propertyType: d.propertyType,
        availabilityDate: d.availabilityDate ? new Date(d.availabilityDate) : null,
        status: "DRAFT",
      },
    });

    return listing;
  });

  return NextResponse.json({ data: { id: result.id, status: result.status } }, { status: 201 });
}

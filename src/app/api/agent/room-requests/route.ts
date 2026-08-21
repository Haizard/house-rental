import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const respondSchema = z.object({
  roomRequestId: z.string().uuid(),
  listingId: z.string().uuid().optional().nullable(),
  message: z.string().trim().min(10).max(1000),
  proposedRent: z.number().int().positive().optional(),
});

/** GET /api/agent/room-requests — List open room requests near the agent */
export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents can browse room requests." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ data: [] });

  const requests = await prisma.roomRequest.findMany({
    where: {
      status: "OPEN",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    include: {
      student: {
        select: {
          user: { select: { firstName: true } },
          university: { select: { name: true } },
        },
      },
      responses: {
        where: { agentId: agent.id },
        select: { id: true, status: true },
      },
    },
  });

  // Map responses to show if agent already applied
  const data = requests.map((req) => ({
    id: req.id,
    title: req.title,
    description: req.description,
    area: req.area,
    propertyType: req.propertyType,
    rentMin: req.rentMin,
    rentMax: req.rentMax,
    roomType: req.roomType,
    amenities: req.amenities,
    moveInDate: req.moveInDate,
    expiresAt: req.expiresAt,
    createdAt: req.createdAt,
    studentName: req.student.user.firstName,
    university: req.student.university?.name ?? null,
    responseCount: req.responses.length,
    hasResponded: req.responses.length > 0,
  }));

  return NextResponse.json({ data });
}

/** POST /api/agent/room-requests — Respond to a room request */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents can respond to room requests." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const parsed = respondSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  const { roomRequestId, listingId, message, proposedRent } = parsed.data;

  // Verify the room request is open
  const roomRequest = await prisma.roomRequest.findFirst({
    where: {
      id: roomRequestId,
      status: "OPEN",
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  if (!roomRequest)
    return NextResponse.json({ error: "Request not found or no longer open." }, { status: 404 });

  // Check if agent already responded
  const existing = await prisma.roomRequestResponse.findUnique({
    where: { roomRequestId_agentId: { roomRequestId, agentId: agent.id } },
    select: { id: true },
  });
  if (existing)
    return NextResponse.json({ error: "You have already responded to this request." }, { status: 409 });

  // Verify the listing belongs to this agent (if provided)
  if (listingId) {
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, agentId: agent.id, status: "ACTIVE" },
      select: { id: true },
    });
    if (!listing)
      return NextResponse.json({ error: "Listing not found or not active." }, { status: 404 });
  }

  const response = await prisma.roomRequestResponse.create({
    data: {
      roomRequestId,
      agentId: agent.id,
      listingId: listingId || null,
      message,
      proposedRent: proposedRent || null,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ data: response }, { status: 201 });
}

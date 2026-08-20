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

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: issues }, { status: 400 });
  }

  const d = parsed.data;

  // When transitioning to ACTIVE, set publishedAt
  const data: Record<string, unknown> = { ...d };
  if (d.status === "ACTIVE" && listing.status !== "ACTIVE") {
    data.publishedAt = new Date();
    data.verificationStatus = "UNVERIFIED";
  }

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data,
    select: { id: true, status: true, verificationStatus: true },
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

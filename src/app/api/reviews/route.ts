import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

const createSchema = z.object({
  agentId: z.string().uuid(),
  listingId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "STUDENT")
    return NextResponse.json({ error: "Only students can leave reviews." }, { status: 403 });

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: issues }, { status: 400 });
  }

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile)
    return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

  // Check if student has a meaningful interaction with this agent
  const hasInteraction = await prisma.lead.findFirst({
    where: {
      studentId: profile.id,
      agentId: parsed.data.agentId,
      status: { in: ["VIEWED", "RENTED", "NEGOTIATING"] },
    },
    select: { id: true },
  });
  if (!hasInteraction) {
    return NextResponse.json(
      { error: "You can only review agents you've interacted with." },
      { status: 403 },
    );
  }

  // Check for duplicate review
  const existing = await prisma.review.findFirst({
    where: {
      studentId: profile.id,
      agentId: parsed.data.agentId,
    },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "You've already reviewed this agent." },
      { status: 409 },
    );
  }

  const d = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.review.create({
      data: {
        studentId: profile.id,
        agentId: d.agentId,
        listingId: d.listingId ?? null,
        rating: d.rating,
        comment: d.comment ?? null,
      },
    });

    // Update agent's average rating
    const stats = await tx.review.aggregate({
      where: { agentId: d.agentId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.agentProfile.update({
      where: { id: d.agentId },
      data: {
        rating: stats._avg.rating ?? 0,
        totalReviews: stats._count.rating,
      },
    });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

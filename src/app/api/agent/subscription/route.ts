import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

const createSchema = z.object({
  planName: z.enum(["FREE", "STANDARD"]).default("STANDARD"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const subscription = await prisma.subscription.findFirst({
    where: { agentId: agent.id, status: { in: ["ACTIVE", "PAST_DUE"] } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: subscription ?? null });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  // Check for existing active subscription
  const existing = await prisma.subscription.findFirst({
    where: { agentId: agent.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "You already have an active subscription." }, { status: 409 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });

  // TODO: Integrate with payment provider
  // For now, create subscription as a placeholder
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const subscription = await prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.create({
      data: {
        agentId: agent.id,
        planName: parsed.data.planName,
        status: parsed.data.planName === "FREE" ? "ACTIVE" : "PAST_DUE",
        startedAt: new Date(),
        expiresAt,
      },
    });

    // Update agent tier (skip if column doesn't exist yet)
    if (parsed.data.planName === "STANDARD") {
      try {
        await tx.agentProfile.update({
          where: { id: agent.id },
          data: { tier: "PRO" },
        });
      } catch {
        // tier column may not exist yet — migration pending
      }
    }

    return sub;
  });

  return NextResponse.json({ data: subscription }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const subscription = await prisma.subscription.findFirst({
    where: { agentId: agent.id, status: { in: ["ACTIVE", "PAST_DUE"] } },
    select: { id: true },
  });
  if (!subscription)
    return NextResponse.json({ error: "No active subscription." }, { status: 404 });

  // Cancel subscription
  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { id: subscription.id },
      data: { status: "CANCELLED" },
    });

    try {
      await tx.agentProfile.update({
        where: { id: agent.id },
        data: { tier: "FREE" },
      });
    } catch {
      // tier column may not exist yet — migration pending
    }
  });

  return NextResponse.json({ ok: true });
}

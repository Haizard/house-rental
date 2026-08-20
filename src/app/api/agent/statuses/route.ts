import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

const createSchema = z.object({
  content: z.string().trim().min(1).max(1000),
  title: z.string().trim().max(100).optional(),
  type: z.enum(["AVAILABLE", "NEW_ROOM", "PRICE_DROP", "URGENT", "GENERAL"]).default("GENERAL"),
  area: z.string().trim().max(100).optional(),
  propertyType: z.string().trim().max(50).optional(),
  rentAmount: z.coerce.number().int().positive().optional(),
  linkedListingId: z.string().uuid().optional(),
});

// Free tier: 3 statuses/day, Pro tier: unlimited
const FREE_DAILY_LIMIT = 3;

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

  const statuses = await prisma.agentStatus.findMany({
    where: { agentId: agent.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { views: true } } },
  });

  return NextResponse.json({ data: statuses });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, tier: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  // Check daily limit for free tier
  if (agent.tier === "FREE") {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await prisma.agentStatus.count({
      where: { agentId: agent.id, createdAt: { gte: todayStart } },
    });
    if (todayCount >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `Free agents can post ${FREE_DAILY_LIMIT} statuses per day. Upgrade to Pro for unlimited.`,
          limitReached: true,
        },
        { status: 429 },
      );
    }
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: issues }, { status: 400 });
  }

  const d = parsed.data;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const status = await prisma.agentStatus.create({
    data: {
      agentId: agent.id,
      type: d.type,
      content: d.content,
      title: d.title ?? null,
      area: d.area ?? null,
      propertyType: d.propertyType ?? null,
      rentAmount: d.rentAmount ?? null,
      linkedListingId: d.linkedListingId ?? null,
      expiresAt,
    },
    select: { id: true, expiresAt: true },
  });

  return NextResponse.json({ data: status }, { status: 201 });
}

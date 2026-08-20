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
  imageUrl: z.string().url().optional(),
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

  // The agent_statuses table may not exist yet (migration pending).
  try {
    const statuses = await prisma.agentStatus.findMany({
      where: { agentId: agent.id, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { views: true } } },
    });
    return NextResponse.json({ data: statuses });
  } catch (error) {
    console.warn("agent_statuses table unavailable for GET.", error);
    return NextResponse.json({ data: [] });
  }
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

  // Check daily limit for free tier (tier column may not exist yet)
  let isFree = true;
  try {
    const row = await prisma.$queryRaw<[{ tier?: string }]>`SELECT tier FROM agent_profiles WHERE id = ${agent.id}::uuid LIMIT 1`;
    isFree = !row[0]?.tier || row[0].tier === "FREE";
  } catch { /* tier column doesn't exist yet, treat as FREE */ }

  if (isFree) {
    try {
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
    } catch {
      // agent_statuses table missing — skip the limit check below
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

  try {
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
        imageUrl: d.imageUrl ?? null,
        expiresAt,
      },
      select: { id: true, expiresAt: true },
    });

    return NextResponse.json({ data: status }, { status: 201 });
  } catch (error) {
    console.warn("Failed to create status — agent_statuses table may not be migrated.", error);
    return NextResponse.json(
      {
        error:
          "Status posting isn't available yet — the statuses table hasn't been migrated. Please run the database migration, then try again.",
      },
      { status: 503 },
    );
  }
}

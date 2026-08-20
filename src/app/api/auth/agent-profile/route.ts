import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

const schema = z.object({
  businessName: z.string().trim().min(1).max(100),
  bio: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: issues }, { status: 400 });
  }

  // Check if agent profile already exists
  const existing = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "Agent profile already exists." }, { status: 409 });
  }

  // Update user role to AGENT
  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: "AGENT" },
  });

  // Create agent profile using raw SQL to avoid tier column issues
  // until the migration is applied
  try {
    // Try with tier column first
    await prisma.$executeRaw`
      INSERT INTO agent_profiles (id, user_id, business_name, bio, verification_status, rating, total_reviews, tier, created_at, updated_at)
      VALUES (gen_random_uuid(), ${session.user.id}::uuid, ${parsed.data.businessName}, ${parsed.data.bio ?? null}, 'UNVERIFIED', 0, 0, 'FREE', NOW(), NOW())
    `;
  } catch {
    // Fall back without tier column (migration not applied yet)
    try {
      await prisma.$executeRaw`
        INSERT INTO agent_profiles (id, user_id, business_name, bio, verification_status, rating, total_reviews, created_at, updated_at)
        VALUES (gen_random_uuid(), ${session.user.id}::uuid, ${parsed.data.businessName}, ${parsed.data.bio ?? null}, 'UNVERIFIED', 0, 0, NOW(), NOW())
      `;
    } catch {
      // Last resort: Prisma (works if column exists but other constraints differ)
      await prisma.agentProfile.create({
        data: {
          userId: session.user.id,
          businessName: parsed.data.businessName,
          bio: parsed.data.bio ?? null,
        },
      });
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

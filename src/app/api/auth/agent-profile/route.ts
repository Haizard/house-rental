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

  // Update user role to AGENT and create profile
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: session.user.id },
      data: { role: "AGENT" },
    });

    await tx.agentProfile.create({
      data: {
        userId: session.user.id,
        businessName: parsed.data.businessName,
        bio: parsed.data.bio ?? null,
      },
    });
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

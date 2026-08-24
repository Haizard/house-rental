import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const blockSchema = z.object({
  agentId: z.string().uuid(),
});

/** GET — list blocked agents */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ data: [] });

  const blocked = await prisma.$queryRaw<{ agent_id: string; business_name: string }[]>`
    SELECT ba.agent_id, ap.business_name
    FROM blocked_agents ba
    JOIN agent_profiles ap ON ap.id = ba.agent_id
    WHERE ba.student_id = ${profile.id}::uuid
  `;

  return NextResponse.json({ data: blocked });
}

/** POST — block an agent */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

  const parsed = blockSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid agent ID." }, { status: 400 });

  try {
    await prisma.$executeRaw`
      INSERT INTO blocked_agents (id, student_id, agent_id, created_at)
      VALUES (gen_random_uuid(), ${profile.id}::uuid, ${parsed.data.agentId}::uuid, NOW())
      ON CONFLICT (student_id, agent_id) DO NOTHING
    `;
  } catch (error) {
    // Table might not exist yet — create it
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS blocked_agents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
          agent_id UUID NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(student_id, agent_id)
        )
      `;
      await prisma.$executeRaw`
        INSERT INTO blocked_agents (id, student_id, agent_id, created_at)
        VALUES (gen_random_uuid(), ${profile.id}::uuid, ${parsed.data.agentId}::uuid, NOW())
        ON CONFLICT (student_id, agent_id) DO NOTHING
      `;
    } catch (e) {
      console.error("Failed to block agent:", e);
      return NextResponse.json({ error: "Failed to block agent." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

/** DELETE — unblock an agent */
export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

  const { agentId } = await request.json().catch(() => ({}));
  if (!agentId) return NextResponse.json({ error: "agentId required." }, { status: 400 });

  try {
    await prisma.$executeRaw`
      DELETE FROM blocked_agents
      WHERE student_id = ${profile.id}::uuid AND agent_id = ${agentId}::uuid
    `;
  } catch {
    // Ignore if table doesn't exist
  }

  return NextResponse.json({ ok: true });
}

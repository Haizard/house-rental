import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const applicationSchema = z.object({
  notes: z.string().trim().min(20).max(2000),
  evidence: z.array(z.string().url()).max(5),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to apply for verification." }, { status: 401 });
  if (session.user.role !== "AGENT") return NextResponse.json({ error: "Only agents can apply for verification." }, { status: 403 });

  const parsed = applicationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Add at least 20 characters and valid evidence links." }, { status: 400 });
  const agent = await prisma.agentProfile.findUnique({ where: { userId: session.user.id }, select: { id: true, verification: true } });
  if (!agent) return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });
  if (agent.verification === "VERIFIED" || agent.verification === "AGENT_VERIFIED") return NextResponse.json({ error: "This agent profile is already verified." }, { status: 409 });

  const application = await prisma.verificationRecord.upsert({
    where: { id: (await prisma.verificationRecord.findFirst({ where: { targetType: "AGENT", targetId: agent.id, status: "PENDING" }, select: { id: true } }))?.id ?? "00000000-0000-0000-0000-000000000000" },
    update: { notes: parsed.data.notes, evidence: parsed.data.evidence },
    create: { targetType: "AGENT", targetId: agent.id, verificationType: "AGENT", notes: parsed.data.notes, evidence: parsed.data.evidence },
  });

  return NextResponse.json({ data: { id: application.id, status: application.status } }, { status: 201 });
}

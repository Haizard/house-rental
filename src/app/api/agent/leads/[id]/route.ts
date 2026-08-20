import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

const patchSchema = z.object({
  status: z.enum([
    "CONTACTED",
    "VIEWING_REQUESTED",
    "VIEWING_CONFIRMED",
    "VIEWED",
    "NEGOTIATING",
    "RENTED",
    "CLOSED",
    "LOST",
  ]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents can update leads." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  const { id } = await params;
  const lead = await prisma.lead.findFirst({
    where: { id, agentId: agent.id },
    select: { id: true },
  });
  if (!lead)
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });

  const updated = await prisma.lead.update({
    where: { id },
    data: { status: parsed.data.status },
    select: { id: true, status: true },
  });

  return NextResponse.json({ data: updated });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const statusSchema = z.enum(["ACCEPTED", "DECLINED", "COMPLETED", "CANCELLED"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to manage viewings." }, { status: 401 });
  if (session.user.role !== "AGENT") return NextResponse.json({ error: "Only agents can manage viewings." }, { status: 403 });

  const parsed = statusSchema.safeParse((await request.json().catch(() => null))?.status);
  if (!parsed.success) return NextResponse.json({ error: "Unsupported viewing status." }, { status: 400 });
  const { id } = await params;
  const agent = await prisma.agentProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!agent) return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const viewing = await prisma.viewingRequest.findFirst({ where: { id, lead: { agentId: agent.id } }, select: { id: true, leadId: true } });
  if (!viewing) return NextResponse.json({ error: "Viewing request not found." }, { status: 404 });

  const updated = await prisma.$transaction(async (transaction) => {
    const result = await transaction.viewingRequest.update({ where: { id: viewing.id }, data: { status: parsed.data } });
    if (parsed.data === "ACCEPTED") await transaction.lead.update({ where: { id: viewing.leadId }, data: { status: "VIEWING_CONFIRMED" } });
    if (parsed.data === "COMPLETED") await transaction.lead.update({ where: { id: viewing.leadId }, data: { status: "VIEWED" } });
    return result;
  });

  return NextResponse.json({ data: { id: updated.id, status: updated.status } });
}

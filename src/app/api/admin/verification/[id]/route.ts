import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().trim().max(2000).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to review verification." }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Only admins can review verification." }, { status: 403 });

  const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  const { id } = await params;
  const record = await prisma.verificationRecord.findFirst({ where: { id, status: "PENDING", targetType: "AGENT" } });
  if (!record) return NextResponse.json({ error: "Pending application not found." }, { status: 404 });

  const updated = await prisma.$transaction(async (transaction) => {
    const application = await transaction.verificationRecord.update({ where: { id }, data: { status: parsed.data.status, notes: parsed.data.notes ?? record.notes, verifiedBy: session.user.id } });
    if (parsed.data.status === "APPROVED") await transaction.agentProfile.update({ where: { id: record.targetId }, data: { verification: "AGENT_VERIFIED" } });
    const agent = await transaction.agentProfile.findUnique({ where: { id: record.targetId }, select: { userId: true } });
    if (agent) await transaction.notification.create({ data: { userId: agent.userId, type: "VERIFICATION_REVIEW", title: `Verification ${parsed.data.status.toLowerCase()}`, message: parsed.data.status === "APPROVED" ? "Your agent profile is now verified." : "Your verification application needs attention.", data: { verificationId: id } } });
    return application;
  });

  return NextResponse.json({ data: { id: updated.id, status: updated.status } });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const requestSchema = z.object({
  scheduledAt: z.string().datetime(),
  notes: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to request a viewing." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Only students can request viewings." }, { status: 403 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || new Date(parsed.data.scheduledAt) <= new Date()) {
    return NextResponse.json({ error: "Choose a future viewing time." }, { status: 400 });
  }

  const { id: listingId } = await params;
  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  const listing = await prisma.listing.findFirst({ where: { id: listingId, status: "ACTIVE" }, select: { id: true, agentId: true, title: true } });
  if (!profile || !listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const viewing = await prisma.$transaction(async (transaction) => {
    let lead = await transaction.lead.findFirst({ where: { studentId: profile.id, listingId: listing.id }, include: { conversation: true } });
    if (!lead) {
      lead = await transaction.lead.create({
        data: {
          studentId: profile.id,
          agentId: listing.agentId,
          listingId: listing.id,
          status: "VIEWING_REQUESTED",
          charges: { create: { amount: 5000, currency: "TZS", status: "PENDING" } },
          conversation: { create: { messages: { create: { senderId: session.user.id, messageType: "SYSTEM", content: `Viewing requested for ${listing.title}.` } } } },
        },
        include: { conversation: true },
      });
      const agent = await transaction.agentProfile.findUnique({ where: { id: listing.agentId }, select: { userId: true } });
      if (agent) await transaction.notification.create({ data: { userId: agent.userId, type: "VIEWING_REQUEST", title: "New viewing request", message: `A student requested to view ${listing.title}.`, data: { listingId: listing.id, leadId: lead.id } } });
    } else if (lead.status === "NEW") {
      await transaction.lead.update({ where: { id: lead.id }, data: { status: "VIEWING_REQUESTED" } });
    }

    const existing = await transaction.viewingRequest.findFirst({ where: { leadId: lead.id, status: { in: ["REQUESTED", "ACCEPTED"] } } });
    if (existing) return existing;
    return transaction.viewingRequest.create({ data: { leadId: lead.id, listingId: listing.id, scheduledAt: new Date(parsed.data.scheduledAt), notes: parsed.data.notes } });
  });

  return NextResponse.json({ data: { id: viewing.id, status: viewing.status } }, { status: 201 });
}

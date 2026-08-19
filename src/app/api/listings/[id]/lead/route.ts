import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/config";

const leadSchema = z.object({
  budget: z.coerce.number().int().nonnegative().optional(),
  moveInDate: z.string().date().optional(),
  requirements: z.string().trim().max(1000).optional(),
});
const listingIdSchema = z.string().uuid();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to contact an agent." }, { status: 401 });
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Only students can create housing leads." }, { status: 403 });

  const parsed = leadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check your budget, move-in date, and requirements." }, { status: 400 });

  const { id } = await params;
  if (!listingIdSchema.safeParse(id).success) return NextResponse.json({ error: "This demo listing is not connected to an account yet." }, { status: 422 });
  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  const listing = await prisma.listing.findFirst({ where: { id, status: "ACTIVE" }, select: { id: true, agentId: true, title: true } });
  if (!profile || !listing) return NextResponse.json({ error: "Listing not found." }, { status: 404 });

  const existingLead = await prisma.lead.findFirst({ where: { studentId: profile.id, listingId: listing.id }, select: { conversation: { select: { id: true } } } });
  if (existingLead?.conversation) return NextResponse.json({ conversationId: existingLead.conversation.id, existing: true });

  const conversation = await prisma.$transaction(async (transaction) => {
    const lead = await transaction.lead.create({
      data: {
        studentId: profile.id,
        agentId: listing.agentId,
        listingId: listing.id,
        budget: parsed.data.budget,
        moveInDate: parsed.data.moveInDate ? new Date(parsed.data.moveInDate) : undefined,
        requirements: parsed.data.requirements ? { text: parsed.data.requirements } : undefined,
        charges: { create: { amount: 5000, currency: "TZS", status: "PENDING" } },
      },
    });
    const createdConversation = await transaction.conversation.create({ data: { leadId: lead.id } });
    await transaction.message.create({ data: { conversationId: createdConversation.id, senderId: session.user.id, messageType: "SYSTEM", content: `New enquiry for ${listing.title}.` } });
    const agent = await transaction.agentProfile.findUnique({ where: { id: listing.agentId }, select: { userId: true } });
    if (agent) await transaction.notification.create({ data: { userId: agent.userId, type: "NEW_LEAD", title: "New student enquiry", message: `A student is interested in ${listing.title}.`, data: { leadId: lead.id, listingId: listing.id } } });
    return createdConversation;
  });

  return NextResponse.json({ conversationId: conversation.id, existing: false }, { status: 201 });
}

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

/**
 * POST /api/student/room-requests/[id]/select
 * Student selects an agent response → creates a Lead + Conversation → chat begins.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "STUDENT")
    return NextResponse.json({ error: "Only students can select responses." }, { status: 403 });

  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!student)
    return NextResponse.json({ error: "Student profile not found." }, { status: 404 });

  const { id: roomRequestId } = await params;
  const body = await request.json().catch(() => ({}));
  const responseId = body.responseId as string;
  if (!responseId)
    return NextResponse.json({ error: "responseId is required." }, { status: 400 });

  // Verify the room request belongs to this student and is still OPEN
  const roomRequest = await prisma.roomRequest.findFirst({
    where: { id: roomRequestId, studentId: student.id, status: "OPEN" },
    select: { id: true },
  });
  if (!roomRequest)
    return NextResponse.json({ error: "Request not found or no longer open." }, { status: 404 });

  // Verify the response belongs to this room request
  const response = await prisma.roomRequestResponse.findFirst({
    where: { id: responseId, roomRequestId },
    select: { id: true, agentId: true, listingId: true, proposedRent: true },
  });
  if (!response)
    return NextResponse.json({ error: "Response not found." }, { status: 404 });

  // Create everything in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Mark this response as SELECTED
    await tx.roomRequestResponse.update({
      where: { id: responseId },
      data: { status: "SELECTED", selectedAt: new Date() },
    });

    // 2. Mark all other responses as DECLINED
    await tx.roomRequestResponse.updateMany({
      where: { roomRequestId, id: { not: responseId } },
      data: { status: "DECLINED" },
    });

    // 3. Mark the room request as SELECTED
    await tx.roomRequest.update({
      where: { id: roomRequestId },
      data: { status: "SELECTED" },
    });

    // 4. Create a Lead (links agent ↔ student ↔ listing)
    const lead = await tx.lead.create({
      data: {
        studentId: student.id,
        agentId: response.agentId,
        listingId: response.listingId ?? (await tx.listing.findFirst({ where: { agentId: response.agentId, status: "ACTIVE" }, select: { id: true } }))?.id ?? "",
        status: "NEGOTIATING",
        source: "SEARCH",
        budget: response.proposedRent,
        leadChargeAmount: 0, // No charge for room request flow
        billingStatus: "WAIVED",
      },
    });

    // 5. Create a Conversation
    const conversation = await tx.conversation.create({
      data: { leadId: lead.id },
    });

    // 6. Send a system message
    await tx.message.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        messageType: "SYSTEM",
        content: `🎉 Connection established! ${session.user.name ?? "Student"} selected a room from this agent based on their room request.`,
      },
    });

    return { lead, conversation };
  });

  return NextResponse.json({
    data: {
      conversationId: result.conversation.id,
      leadId: result.lead.id,
      message: "Agent selected! You can now chat with them.",
    },
  });
}

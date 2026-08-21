import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const CONTACT_REVEAL_FEE = 5000; // TZS 5,000 ("elfu tano")

/**
 * POST /api/chat/[conversationId]/contact-reveal
 * Agent requests to see student's contact info.
 * Charges TZS 5,000 and reveals contact card to agent.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (session.user.role !== "AGENT")
    return NextResponse.json({ error: "Only agents can request contact info." }, { status: 403 });

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent)
    return NextResponse.json({ error: "Agent profile not found." }, { status: 404 });

  const { conversationId } = await params;

  // Verify the agent owns this conversation
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      lead: { agentId: agent.id },
    },
    select: {
      id: true,
      contactRequestStatus: true,
      lead: {
        select: {
          studentId: true,
          student: {
            select: {
              userId: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!conversation)
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  // Already revealed
  if (conversation.contactRequestStatus === "REVEALED") {
    // Return the contact info directly
    const student = conversation.lead.student.user;
    return NextResponse.json({
      data: {
        status: "REVEALED",
        student: {
          firstName: student.firstName,
          lastName: student.lastName,
          phone: student.phone,
          email: student.email,
        },
      },
    });
  }

  // Check for existing pending request
  if (conversation.contactRequestStatus === "REQUESTED" || conversation.contactRequestStatus === "PAID") {
    return NextResponse.json(
      { error: "Contact request already pending. Please wait for confirmation." },
      { status: 409 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const paymentRef = body.paymentRef || null;

  // Process in transaction: create payment record, update conversation status, create contact reveal
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create payment record
    const payment = await tx.payment.create({
      data: {
        userId: session.user.id,
        agentId: agent.id,
        type: "LEAD_FEE",
        amount: CONTACT_REVEAL_FEE,
        currency: "TZS",
        provider: "manual", // Will be updated with real provider later
        providerTransactionId: paymentRef,
        status: "SUCCEEDED", // Auto-approve for now (mock payment)
        metadata: { purpose: "contact_reveal", conversationId },
      },
    });

    // 2. Create contact reveal record
    const reveal = await tx.contactReveal.create({
      data: {
        conversationId,
        agentId: agent.id,
        studentId: conversation.lead.studentId,
        amount: CONTACT_REVEAL_FEE,
        paymentStatus: "SUCCEEDED",
        paymentRef: payment.id,
        revealedAt: new Date(),
      },
    });

    // 3. Update conversation status
    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        contactRequestStatus: "REVEALED",
        contactRevealedAt: new Date(),
      },
    });

    // 4. Send a system message with the contact card
    await tx.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        messageType: "SYSTEM",
        content: `📞 Contact information revealed. You can now contact ${conversation.lead.student.user.firstName} ${conversation.lead.student.user.lastName}.`,
      },
    });

    // 5. Notify the student
    await tx.notification.create({
      data: {
        userId: conversation.lead.student.userId,
        type: "CONTACT_REVEALED",
        title: "Contact Information Shared",
        message: `An agent has paid to view your contact information for this listing.`,
        data: { conversationId },
      },
    });

    return { payment, reveal };
  });

  const student = conversation.lead.student.user;
  return NextResponse.json({
    data: {
      status: "REVEALED",
      revealId: result.reveal.id,
      paymentId: result.payment.id,
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
        email: student.email,
      },
    },
  });
}

/**
 * GET /api/chat/[conversationId]/contact-reveal
 * Check if contact info has been revealed for this conversation.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const { conversationId } = await params;

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      lead: {
        OR: [
          { student: { userId: session.user.id } },
          { agent: { userId: session.user.id } },
        ],
      },
    },
    select: {
      contactRequestStatus: true,
      contactRequestedAt: true,
      contactRevealedAt: true,
      lead: {
        select: {
          student: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
          agent: {
            select: {
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!conversation)
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  const isAgent = conversation.lead.agent.userId === session.user.id;
  const isRevealed = conversation.contactRequestStatus === "REVEALED";

  // Only show contact info to agent if revealed, and only if the agent paid
  const contactInfo =
    isRevealed && isAgent
      ? {
          firstName: conversation.lead.student.user.firstName,
          lastName: conversation.lead.student.user.lastName,
          phone: conversation.lead.student.user.phone,
          email: conversation.lead.student.user.email,
        }
      : null;

  return NextResponse.json({
    data: {
      status: conversation.contactRequestStatus,
      requestedAt: conversation.contactRequestedAt,
      revealedAt: conversation.contactRevealedAt,
      contactInfo,
      fee: CONTACT_REVEAL_FEE,
    },
  });
}

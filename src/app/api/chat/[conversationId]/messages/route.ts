import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { detectContactInfo } from "@/lib/chat/contact-guard";

const messageSchema = z.object({ content: z.string().trim().min(1).max(2000) });

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in to view messages." }, { status: 401 });

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
    select: { id: true },
  });
  if (!conversation)
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  // Optional cursor for incremental polling: return only messages after this date
  const { searchParams } = new URL(request.url);
  const after = searchParams.get("after");

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      senderId: true,
      messageType: true,
      content: true,
      attachmentUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "Sign in to send messages." }, { status: 401 });

  const { conversationId } = await params;
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Write a message before sending." }, { status: 400 });

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
    select: { id: true, contactRequestStatus: true },
  });
  if (!conversation)
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  // Block contact info unless contact has been revealed
  if (conversation.contactRequestStatus !== "REVEALED") {
    const guard = detectContactInfo(parsed.data.content);
    if (guard.blocked) {
      return NextResponse.json({ error: guard.reason }, { status: 403 });
    }
  }

  const message = await prisma.$transaction(async (transaction) => {
    const created = await transaction.message.create({
      data: { conversationId, senderId: session.user.id, content: parsed.data.content },
    });
    await transaction.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: created.createdAt },
    });
    return created;
  });

  // Send push notification to the other party (non-blocking)
  try {
    const lead = await prisma.lead.findFirst({
      where: { id: conversationId },
      include: {
        student: { include: { user: true } },
        agent: { include: { user: true } },
        listing: { select: { title: true } },
      },
    });

    if (lead) {
      const recipientUserId = session.user.id === lead.student.userId
        ? lead.agent.userId
        : lead.student.userId;
      const senderName = session.user.id === lead.student.userId
        ? lead.student.user.firstName
        : (lead.agent as any).businessName || lead.agent.user.firstName;

      const { sendPushToUser } = await import("@/lib/push/web-push");
      sendPushToUser(recipientUserId, {
        title: senderName || "New message",
        body: parsed.data.content.slice(0, 100),
        url: `/chat/${conversationId}`,
        tag: `chat-${conversationId}`,
        data: { type: "NEW_MESSAGE", conversationId, listingTitle: lead.listing?.title },
      }).catch(() => {}); // fire-and-forget
    }
  } catch { /* push is best-effort */ }

  return NextResponse.json(
    {
      data: {
        id: message.id,
        senderId: message.senderId,
        messageType: message.messageType,
        content: message.content,
        createdAt: message.createdAt,
      },
    },
    { status: 201 },
  );
}

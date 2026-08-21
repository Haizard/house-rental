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

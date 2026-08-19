import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

const messageSchema = z.object({ content: z.string().trim().min(1).max(2000) });

export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in to send messages." }, { status: 401 });
  const { conversationId } = await params;
  const parsed = messageSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write a message before sending." }, { status: 400 });

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      lead: { OR: [{ student: { userId: session.user.id } }, { agent: { userId: session.user.id } }] },
    },
    select: { id: true },
  });
  if (!conversation) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });

  const message = await prisma.$transaction(async (transaction) => {
    const created = await transaction.message.create({ data: { conversationId, senderId: session.user.id, content: parsed.data.content } });
    await transaction.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: created.createdAt } });
    return created;
  });

  return NextResponse.json({ data: { id: message.id, content: message.content, createdAt: message.createdAt } }, { status: 201 });
}

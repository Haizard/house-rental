import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

// In-memory typing status (resets on server restart, which is fine for UX)
const typingUsers = new Map<string, { userId: string; expiresAt: number }[]>();

function getTypingUsers(conversationId: string): string[] {
  const now = Date.now();
  const users = typingUsers.get(conversationId) || [];
  // Clean expired entries
  const active = users.filter((u) => u.expiresAt > now);
  typingUsers.set(conversationId, active);
  return active.map((u) => u.userId);
}

const typingSchema = z.object({
  isTyping: z.boolean(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { conversationId } = await params;

  // Verify access
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      lead: {
        select: {
          student: { select: { userId: true } },
          agent: { select: { userId: true } },
        },
      },
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const userId = session.user.id;
  const hasAccess =
    conversation.lead.student.userId === userId ||
    conversation.lead.agent.userId === userId;

  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = typingSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (parsed.data.isTyping) {
    // Add/update typing status (expires in 5 seconds)
    const users = typingUsers.get(conversationId) || [];
    const existing = users.findIndex((u) => u.userId === userId);
    const entry = { userId, expiresAt: Date.now() + 5000 };
    if (existing >= 0) {
      users[existing] = entry;
    } else {
      users.push(entry);
    }
    typingUsers.set(conversationId, users);
  } else {
    // Remove typing status
    const users = typingUsers.get(conversationId) || [];
    typingUsers.set(
      conversationId,
      users.filter((u) => u.userId !== userId)
    );
  }

  // Get other user's typing status
  const otherUserId = userId === conversation.lead.student.userId
    ? conversation.lead.agent.userId
    : conversation.lead.student.userId;

  const allTyping = getTypingUsers(conversationId);
  const otherUserTyping = allTyping.includes(otherUserId);

  return NextResponse.json({
    typing: otherUserTyping,
    typingUsers: allTyping.length,
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { conversationId } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      lead: {
        select: {
          student: { select: { userId: true } },
          agent: { select: { userId: true } },
        },
      },
      lastMessageAt: true,
    },
  });

  if (!conversation) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const userId = session.user.id;
  const otherUserId = userId === conversation.lead.student.userId
    ? conversation.lead.agent.userId
    : conversation.lead.student.userId;

  const allTyping = getTypingUsers(conversationId);
  const otherUserTyping = allTyping.includes(otherUserId);

  // Check if other user was recently active (within last 30 seconds)
  const lastActive = conversation.lastMessageAt?.getTime() || 0;
  const isOnline = Date.now() - lastActive < 30000;

  return NextResponse.json({
    typing: otherUserTyping,
    isOnline,
    lastActive: conversation.lastMessageAt?.toISOString() || null,
  });
}

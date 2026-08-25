import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

// ── In-memory typing registry (same process only — fine for Vercel's model) ──
// Key: conversationId → Map<userId, expiryTimestamp>
const typingStore = new Map<string, Map<string, number>>();

export function setTyping(conversationId: string, userId: string, typing: boolean) {
  let conv = typingStore.get(conversationId);
  if (!conv) { conv = new Map(); typingStore.set(conversationId, conv); }
  if (typing) {
    conv.set(userId, Date.now() + 5000); // expires in 5 s
  } else {
    conv.delete(userId);
  }
}

function getOtherTyping(conversationId: string, currentUserId: string): boolean {
  const conv = typingStore.get(conversationId);
  if (!conv) return false;
  const now = Date.now();
  for (const [uid, expiry] of conv) {
    if (uid !== currentUserId && expiry > now) return true;
  }
  return false;
}

function cleanExpired(conversationId: string) {
  const conv = typingStore.get(conversationId);
  if (!conv) return;
  const now = Date.now();
  for (const [uid, expiry] of conv) {
    if (expiry <= now) conv.delete(uid);
  }
  if (conv.size === 0) typingStore.delete(conversationId);
}

// ── Online tracking ─────────────────────────────────────────────────────────
// Map<conversationId, Map<userId, lastSeenTimestamp>>
const onlineStore = new Map<string, Map<string, number>>();

function touchOnline(conversationId: string, userId: string) {
  let conv = onlineStore.get(conversationId);
  if (!conv) { conv = new Map(); onlineStore.set(conversationId, conv); }
  conv.set(userId, Date.now());
}

function isOtherOnline(conversationId: string, currentUserId: string): boolean {
  const conv = onlineStore.get(conversationId);
  if (!conv) return false;
  const now = Date.now();
  for (const [uid, lastSeen] of conv) {
    if (uid !== currentUserId && now - lastSeen < 15_000) return true;
  }
  return false;
}

/**
 * SSE endpoint for real-time chat.
 *
 * Streams three event types on a single connection:
 *   event: message   — new chat message
 *   event: typing    — other user started/stopped typing
 *   event: online    — other user's online status (on every heartbeat)
 *   event: timeout   — stream closing after 5 min
 *
 * This replaces the separate /typing GET poll — one connection, one poll loop.
 */
export async function GET(
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

  const otherUserId =
    userId === conversation.lead.student.userId
      ? conversation.lead.agent.userId
      : conversation.lead.student.userId;

  // Cursor: only fetch messages newer than this
  const url = new URL(request.url);
  const afterParam = url.searchParams.get("after");
  let afterDate = afterParam ? new Date(afterParam) : new Date(0);

  // Mark this user as online
  touchOnline(conversationId, userId);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // SSE comment keepalive
      controller.enqueue(encoder.encode(":\n\n"));

      let lastTypingState = false;
      let pollCount = 0;

      const poll = async () => {
        try {
          // 1) New messages
          const messages = await prisma.message.findMany({
            where: { conversationId, createdAt: { gt: afterDate } },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              content: true,
              messageType: true,
              senderId: true,
              createdAt: true,
              isRead: true,
            },
          });

          for (const msg of messages) {
            const data = JSON.stringify({
              id: msg.id,
              content: msg.content,
              type: msg.messageType,
              senderId: msg.senderId,
              isOwn: msg.senderId === userId,
              createdAt: msg.createdAt.toISOString(),
              isRead: msg.isRead,
            });
            controller.enqueue(encoder.encode(`event: message\ndata: ${data}\n\n`));
            // Advance cursor
            if (msg.createdAt > afterDate) afterDate = msg.createdAt;
          }

          // 2) Typing indicator (only send on change to avoid spam)
          cleanExpired(conversationId);
          const otherTyping = getOtherTyping(conversationId, userId);
          if (otherTyping !== lastTypingState) {
            lastTypingState = otherTyping;
            controller.enqueue(
              encoder.encode(`event: typing\ndata: ${JSON.stringify({ typing: otherTyping })}\n\n`)
            );
          }

          // 3) Online status — send every 3rd poll (~6 s) to keep it fresh
          if (pollCount % 3 === 0) {
            const online = isOtherOnline(conversationId, userId);
            controller.enqueue(
              encoder.encode(`event: online\ndata: ${JSON.stringify({ online })}\n\n`)
            );
          }

          // 4) Keepalive comment
          controller.enqueue(encoder.encode(":\n\n"));
        } catch {
          // silent
        }

        // Refresh own online timestamp
        touchOnline(conversationId, userId);
        pollCount++;
      };

      // First poll immediately
      await poll();

      // Then every 2 seconds
      const interval = setInterval(poll, 2000);

      // Cleanup on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        // Remove from online store
        const conv = onlineStore.get(conversationId);
        if (conv) { conv.delete(userId); if (conv.size === 0) onlineStore.delete(conversationId); }
        try { controller.close(); } catch { /* already closed */ }
      });

      // Safety: close after 5 minutes (client should reconnect)
      setTimeout(() => {
        clearInterval(interval);
        try {
          controller.enqueue(encoder.encode("event: timeout\ndata: {}\n\n"));
          controller.close();
        } catch { /* already closed */ }
      }, 5 * 60 * 1000);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

/**
 * POST endpoint — accept typing heartbeats from the client.
 * The SSE stream reads from the in-memory typingStore,
 * so the client just POSTs here to keep its "typing" flag alive.
 */
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

  let body: { isTyping?: boolean } = {};
  try { body = await request.json(); } catch { /* empty */ }

  setTyping(conversationId, userId, body.isTyping === true);
  touchOnline(conversationId, userId);

  return NextResponse.json({ ok: true });
}

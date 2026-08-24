import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";

/**
 * SSE endpoint for real-time chat messages.
 * Client connects: GET /api/chat/{conversationId}/events
 * Server polls DB every 2s and streams new messages as events.
 *
 * This is simpler and more reliable than WebSockets on Vercel.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const { id: conversationId } = await params;

  // Verify user has access to this conversation
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      lead: {
        select: {
          agentId: true,
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

  // Get the after parameter from URL
  const url = new URL(request.url);
  const afterParam = url.searchParams.get("after");
  const afterDate = afterParam ? new Date(afterParam) : new Date(0);

  // Create SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial keepalive
      controller.enqueue(encoder.encode(":\n\n"));

      let lastCheck = Date.now();
      const pollInterval = 2000; // 2 seconds

      const poll = async () => {
        try {
          const messages = await prisma.message.findMany({
            where: {
              conversationId,
              createdAt: { gt: afterDate },
            },
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

          if (messages.length > 0) {
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
              controller.enqueue(
                encoder.encode(`data: ${data}\n\n`)
              );
            }
          }

          // Send heartbeat to keep connection alive
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          // Silently handle errors
        }

        lastCheck = Date.now();
      };

      // Initial poll
      await poll();

      // Continue polling
      const interval = setInterval(async () => {
        await poll();
      }, pollInterval);

      // Cleanup on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });

      // Safety timeout — close after 5 minutes
      setTimeout(() => {
        clearInterval(interval);
        try {
          controller.enqueue(
            encoder.encode("event: timeout\ndata: {}\n\n")
          );
          controller.close();
        } catch {
          // Already closed
        }
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

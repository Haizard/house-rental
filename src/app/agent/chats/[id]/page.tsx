import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ChatThread, type ChatMessage } from "@/components/chat/chat-thread";

export default async function AgentChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("AGENT");
  const { id } = await params;

  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!agent) notFound();

  const conversation = await prisma.conversation.findFirst({
    where: { id, lead: { agentId: agent.id } },
    include: {
      lead: {
        include: {
          listing: { select: { title: true } },
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!conversation) notFound();

  const initialMessages: ChatMessage[] = conversation.messages.map((message) => ({
    id: message.id,
    senderId: message.senderId,
    messageType: message.messageType,
    content: message.content,
    attachmentUrl: message.attachmentUrl,
    createdAt: message.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-3xl flex-col">
      <header className="glass-nav flex items-center gap-3 px-4 py-3">
        <Link
          className="flex size-10 items-center justify-center rounded-full"
          href="/agent/chats"
          aria-label="Back to chats"
        >
          <ArrowLeft size={19} aria-hidden="true" />
        </Link>
        <div>
          <p className="font-semibold">
            {conversation.lead.student.user.firstName}{" "}
            {conversation.lead.student.user.lastName}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {conversation.lead.listing.title}
          </p>
        </div>
      </header>

      <ChatThread
        conversationId={id}
        initialMessages={initialMessages}
        currentUserId={session.user.id}
      />
    </div>
  );
}

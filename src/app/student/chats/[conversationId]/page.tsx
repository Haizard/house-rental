import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ChatThread, type ChatMessage } from "@/components/chat/chat-thread";
import { ContactReveal } from "@/components/chat/contact-reveal";

export default async function StudentChatPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const session = await requireRole("STUDENT");
  const { conversationId } = await params;
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      lead: { student: { userId: session.user.id } },
    },
    include: {
      lead: {
        include: {
          listing: true,
          agent: { include: { user: true } },
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
          href="/student/chats"
          aria-label="Back to chats"
        >
          <ArrowLeft size={19} aria-hidden="true" />
        </Link>
        <div>
          <p className="font-semibold">
            {conversation.lead.agent.businessName}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {conversation.lead.listing.title}
          </p>
        </div>
      </header>

      <ContactReveal conversationId={conversationId} isAgent={false} />

      <ChatThread
        conversationId={conversationId}
        initialMessages={initialMessages}
        currentUserId={session.user.id}
      />
    </div>
  );
}

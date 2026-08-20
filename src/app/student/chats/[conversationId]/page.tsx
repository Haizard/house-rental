import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ChatComposer } from "@/components/chat/chat-composer";

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

      <section className="flex-1 space-y-3 py-6">
        {conversation.messages.map((message) => (
          <div
            className={`flex ${
              message.senderId === session.user.id
                ? "justify-end"
                : "justify-start"
            }`}
            key={message.id}
          >
            <p
              className={`max-w-[82%] rounded-[18px] px-4 py-3 text-sm leading-5 ${
                message.messageType === "SYSTEM"
                  ? "bg-[var(--accent-soft)] text-[var(--text-secondary)]"
                  : message.senderId === session.user.id
                    ? "bg-[var(--accent)] text-white"
                    : "glass-surface"
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
      </section>

      <ChatComposer conversationId={conversationId} />
    </div>
  );
}

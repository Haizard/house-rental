import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";
import { ChatComposer } from "@/components/chat/chat-composer";

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

      <ChatComposer conversationId={id} />
    </div>
  );
}

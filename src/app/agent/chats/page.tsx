import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";

export default async function AgentChatsPage() {
  const session = await requireRole("AGENT");
  const agent = await prisma.agentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const conversations = agent
    ? await prisma.conversation.findMany({
        where: { lead: { agentId: agent.id } },
        include: {
          lead: {
            include: {
              listing: { select: { title: true } },
              student: { include: { user: { select: { firstName: true, lastName: true } } } },
            },
          },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
      })
    : [];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Agent workspace</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Chats</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Conversations with students about your listings.
        </p>
      </header>

      {conversations.length === 0 ? (
        <div className="glass-surface mt-4 flex min-h-64 flex-col items-center justify-center p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <MessageCircle size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No conversations yet</h2>
          <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">
            When students contact you about a listing, conversations will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const lastMessage = conv.messages[0];
            return (
              <Link
                className="glass-surface flex items-center gap-4 p-4 transition hover:-translate-y-0.5"
                href={`/agent/chats/${conv.id}`}
                key={conv.id}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-sm font-bold">
                  {conv.lead.student.user.firstName.charAt(0)}
                  {conv.lead.student.user.lastName.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-semibold">
                      {conv.lead.student.user.firstName}{" "}
                      {conv.lead.student.user.lastName}
                    </h3>
                    {lastMessage && (
                      <span className="shrink-0 text-xs text-[var(--text-tertiary)]">
                        {new Intl.DateTimeFormat("en-TZ", {
                          dateStyle: "medium",
                        }).format(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {conv.lead.listing.title}
                  </p>
                  {lastMessage && (
                    <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
                      {lastMessage.content}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

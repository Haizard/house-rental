import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guards";

export default async function StudentChatsPage() {
  const session = await requireRole("STUDENT");
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  const conversations = profile
    ? await prisma.conversation.findMany({
        where: { lead: { studentId: profile.id } },
        include: {
          lead: {
            include: {
              listing: { select: { title: true } },
              agent: { select: { businessName: true } },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
      })
    : [];

  return (
    <div className="mx-auto max-w-5xl">
      <header className="pb-8 pt-10">
        <p className="eyebrow">Student workspace</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Chats</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Conversations with agents about listings.
        </p>
      </header>

      {conversations.length === 0 ? (
        <div className="glass-surface mt-4 flex min-h-64 flex-col items-center justify-center p-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <MessageCircle size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">No conversations yet</h2>
          <p className="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">
            Start a conversation by tapping &quot;Chat with agent&quot; on a
            listing.
          </p>
          <Link
            className="button button-primary mt-6"
            href="/search"
          >
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const lastMessage = conv.messages[0];
            return (
              <Link
                className="glass-surface flex items-center gap-4 p-4 transition hover:-translate-y-0.5"
                href={`/student/chats/${conv.id}`}
                key={conv.id}
              >
                {/* Avatar placeholder */}
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <MessageCircle size={20} aria-hidden="true" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="truncate font-semibold">
                      {conv.lead.agent.businessName}
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
                      {lastMessage.senderId === session.user.id ? "You: " : ""}
                      {lastMessage.messageType === "SYSTEM"
                        ? lastMessage.content
                        : lastMessage.content}
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

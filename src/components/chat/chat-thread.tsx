"use client";

import { Send } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

export type ChatMessage = {
  id: string;
  senderId: string;
  messageType: string;
  content: string;
  attachmentUrl: string | null;
  createdAt: string;
};

interface Props {
  conversationId: string;
  initialMessages: ChatMessage[];
  currentUserId: string;
}

const POLL_INTERVAL_MS = 2_000;

export function ChatThread({ conversationId, initialMessages, currentUserId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lastMessageAtRef = useRef<string | undefined>(
    initialMessages[initialMessages.length - 1]?.createdAt,
  );

  // Poll for new messages every few seconds
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      if (!active) return;
      const after = lastMessageAtRef.current;
      try {
        const url = `/api/chat/${conversationId}/messages${after ? `?after=${encodeURIComponent(after)}` : ""}`;
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
          const payload = await response.json();
          const fresh: ChatMessage[] = payload.data ?? [];
          if (fresh.length > 0) {
            lastMessageAtRef.current = fresh[fresh.length - 1].createdAt;
            setMessages((current) => {
              const seen = new Set(current.map((message) => message.id));
              const additions = fresh.filter((message) => !seen.has(message.id));
              return additions.length > 0 ? [...current, ...additions] : current;
            });
          }
        }
      } catch {
        // ignore transient network errors, retry next tick
      } finally {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    timer = setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [conversationId]);

  // Scroll to the newest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || pending) return;

    setPending(true);
    const response = await fetch(`/api/chat/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
    });

    if (response.ok) {
      const payload = await response.json();
      const created: ChatMessage = payload.data;
      // Optimistically append our own message immediately
      lastMessageAtRef.current = created.createdAt;
      setMessages((current) =>
        current.some((message) => message.id === created.id)
          ? current
          : [...current, created],
      );
      setContent("");
    }
    setPending(false);
  }

  return (
    <>
      <section className="flex-1 space-y-3 py-6">
        {messages.map((message) => (
          <div
            className={`flex ${
              message.senderId === currentUserId ? "justify-end" : "justify-start"
            }`}
            key={message.id}
          >
            <p
              className={`max-w-[82%] rounded-[18px] px-4 py-3 text-sm leading-5 ${
                message.messageType === "SYSTEM"
                  ? "bg-[var(--accent-soft)] text-[var(--text-secondary)]"
                  : message.senderId === currentUserId
                    ? "bg-[var(--accent)] text-white"
                    : "glass-surface"
              }`}
            >
              {message.content}
            </p>
          </div>
        ))}
        <div ref={endRef} />
      </section>

      <form
        className="glass-search flex items-center gap-2 p-2"
        onSubmit={submit}
      >
        <label className="sr-only" htmlFor="message">
          Message
        </label>
        <input
          className="min-h-10 flex-1 bg-transparent px-2 outline-none"
          id="message"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write a message"
          maxLength={2000}
        />
        <button
          className="button button-primary size-11 shrink-0 rounded-full"
          disabled={pending || !content.trim()}
          type="submit"
          aria-label="Send message"
        >
          <Send size={17} aria-hidden="true" />
        </button>
      </form>
    </>
  );
}

"use client";

import { Send } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { haptic } from "@/lib/ui/haptics";

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

const POLL_INTERVAL_MS = 3_000;

export function ChatThread({ conversationId, initialMessages, currentUserId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Poll for new messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/chat/${conversationId}/messages`, { cache: "no-store" });
        if (!response.ok) return;
        const payload = await response.json();
        const fresh: ChatMessage[] = payload.data ?? [];
        if (fresh.length === 0) return;
        setMessages((current) => {
          const seen = new Set(current.map((m) => m.id));
          const additions = fresh.filter((m) => !seen.has(m.id));
          return additions.length > 0 ? [...current, ...additions] : current;
        });
      } catch {
        // ignore transient errors
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [conversationId]);

  // Scroll to the newest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Poll for typing indicator and online status
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/${conversationId}/typing`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setIsOtherTyping(data.typing);
          setIsOtherOnline(data.isOnline);
        }
      } catch { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  // Send typing indicator when user types
  function handleTyping() {
    // Notify server we're typing
    fetch(`/api/chat/${conversationId}/typing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping: true }),
    }).catch(() => {});

    // Auto-clear after 5s of inactivity
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      fetch(`/api/chat/${conversationId}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping: false }),
      }).catch(() => {});
    }, 5000);
  }

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
      setMessages((current) =>
        current.some((message) => message.id === created.id)
          ? current
          : [...current, created],
      );
      setContent("");
      haptic("success");
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
              className={`max-w-[82%] rounded-[18px] px-4 py-3 text-sm leading-5 animate-message-in ${
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
        {/* Typing indicator */}
        {isOtherTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className="glass-surface rounded-[18px] px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="inline-block size-2 animate-bounce rounded-full bg-[var(--text-tertiary)]" style={{ animationDelay: "0ms" }} />
                <span className="inline-block size-2 animate-bounce rounded-full bg-[var(--text-tertiary)]" style={{ animationDelay: "150ms" }} />
                <span className="inline-block size-2 animate-bounce rounded-full bg-[var(--text-tertiary)]" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </section>

      <form
        className="glass-search relative flex items-center gap-2 p-2"
        onSubmit={submit}
      >
        <label className="sr-only" htmlFor="message">
          Message
        </label>
        {/* Online status */}
        {isOtherOnline && !isOtherTyping && (
          <span className="absolute -top-6 left-2 text-[11px] text-green-500">
            ● Online
          </span>
        )}
        <input
          className="min-h-10 flex-1 bg-transparent px-2 outline-none"
          id="message"
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            handleTyping();
          }}
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

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

export function ChatThread({ conversationId, initialMessages, currentUserId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMessageDateRef = useRef<string>(
    initialMessages.length > 0
      ? initialMessages[initialMessages.length - 1].createdAt
      : new Date(0).toISOString()
  );

  // ── Single SSE connection for messages + typing + online ──
  useEffect(() => {
    let retryTimeout: ReturnType<typeof setTimeout>;
    let eventSource: EventSource | null = null;

    function connect() {
      const after = encodeURIComponent(lastMessageDateRef.current);
      eventSource = new EventSource(
        `/api/chat/${conversationId}/events?after=${after}`
      );

      // New message
      eventSource.addEventListener("message", (e) => {
        try {
          const msg: ChatMessage & { isOwn: boolean } = JSON.parse(e.data);
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, { ...msg }];
          });
          if (msg.createdAt > lastMessageDateRef.current) {
            lastMessageDateRef.current = msg.createdAt;
          }
        } catch { /* ignore bad data */ }
      });

      // Typing indicator
      eventSource.addEventListener("typing", (e) => {
        try {
          const data = JSON.parse(e.data);
          setIsOtherTyping(Boolean(data.typing));
        } catch { /* ignore */ }
      });

      // Online status
      eventSource.addEventListener("online", (e) => {
        try {
          const data = JSON.parse(e.data);
          setIsOtherOnline(Boolean(data.online));
        } catch { /* ignore */ }
      });

      // Stream timed out — reconnect after a short delay
      eventSource.addEventListener("timeout", () => {
        eventSource?.close();
        retryTimeout = setTimeout(connect, 2000);
      });

      eventSource.onerror = () => {
        eventSource?.close();
        retryTimeout = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(retryTimeout);
      eventSource?.close();
    };
  }, [conversationId]);

  // Scroll to newest message
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // ── Send typing heartbeat via POST (keeps the in-memory flag alive) ──
  function sendTypingHeartbeat() {
    fetch(`/api/chat/${conversationId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping: true }),
    }).catch(() => {});

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      fetch(`/api/chat/${conversationId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping: false }),
      }).catch(() => {});
    }, 5000);
  }

  // ── Send message ──
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || pending) return;

    setPending(true);
    // Clear typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    fetch(`/api/chat/${conversationId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isTyping: false }),
    }).catch(() => {});

    const response = await fetch(`/api/chat/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: trimmed }),
    });

    if (response.ok) {
      const payload = await response.json();
      const created: ChatMessage = payload.data;
      // Optimistic append — SSE will deduplicate
      setMessages((prev) =>
        prev.some((m) => m.id === created.id) ? prev : [...prev, created]
      );
      if (created.createdAt > lastMessageDateRef.current) {
        lastMessageDateRef.current = created.createdAt;
      }
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
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block size-2 animate-bounce rounded-full bg-[var(--text-tertiary)]"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="inline-block size-2 animate-bounce rounded-full bg-[var(--text-tertiary)]"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="inline-block size-2 animate-bounce rounded-full bg-[var(--text-tertiary)]"
                  style={{ animationDelay: "300ms" }}
                />
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

        {/* Online status indicator */}
        {isOtherOnline && !isOtherTyping && (
          <span className="absolute -top-6 left-2 text-[11px] font-medium text-[#FBC618] animate-fade-in">
            ● Online
          </span>
        )}

        <input
          className="h-8 flex-1 bg-transparent px-2 outline-none"
          id="message"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            sendTypingHeartbeat();
          }}
          placeholder="Write a message"
          maxLength={2000}
        />
        <button
          className="button button-primary size-9 shrink-0 rounded-full"
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

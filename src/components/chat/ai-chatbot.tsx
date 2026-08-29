"use client";

import { MessageCircle, Send, X, Bot, Loader2, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Habari! I'm your housing assistant. Tell me what you're looking for — area, budget, room type — and I'll help you find the perfect room in Arusha.\n\nTry: \"Njiro, self-contained, under 150k\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.data) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.data.content }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please check your connection." },
      ]);
    }
    setLoading(false);
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-500 text-white shadow-lg shadow-[var(--accent)]/30 transition-transform hover:scale-110 sm:bottom-6"
          aria-label="Open AI assistant"
        >
          <Bot size={24} />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-4 z-40 flex w-[340px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[22px] border border-[var(--glass-border)] bg-[var(--glass-fill-strong)] shadow-2xl backdrop-blur-xl sm:bottom-4 sm:right-4 animate-scale-in"
          style={{ maxHeight: "min(520px, calc(100vh - 120px))" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[var(--glass-border)] px-4 py-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent)] to-purple-500">
              <Sparkles size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Housing Assistant
              </h3>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                Ask in English or Swahili
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex size-8 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--accent-soft)]"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                key={i}
              >
                <div
                  className={`max-w-[85%] rounded-[16px] px-3.5 py-2.5 font-t-subhead leading-5 animate-message-in ${
                    msg.role === "user"
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--glass-fill)] border border-[var(--glass-border)] text-[var(--text-primary)]"
                  }`}
                >
                  {/* Render markdown-like content */}
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-[16px] bg-[var(--glass-fill)] border border-[var(--glass-border)] px-3.5 py-2.5">
                  <Loader2 size={14} className="animate-spin text-[var(--accent)]" />
                  <span className="text-[12px] text-[var(--text-tertiary)]">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <form
            className="flex items-center gap-2 border-t border-[var(--glass-border)] px-3 py-2.5"
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          >
            <input
              className="min-h-10 flex-1 bg-transparent font-t-subhead outline-none placeholder:text-[var(--text-tertiary)]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              maxLength={500}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-transform hover:scale-105 disabled:opacity-50"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

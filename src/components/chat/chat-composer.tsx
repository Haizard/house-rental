"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function ChatComposer({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content.trim()) return;
    setPending(true);
    const response = await fetch(`/api/chat/${conversationId}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }) });
    if (response.ok) {
      setContent("");
      router.refresh();
    }
    setPending(false);
  }

  return <form className="glass-search flex items-center gap-2 p-2" onSubmit={submit}><label className="sr-only" htmlFor="message">Message agent</label><input className="min-h-10 flex-1 bg-transparent px-2 outline-none" id="message" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Write a message" maxLength={2000} /><button className="button button-primary size-11 shrink-0 rounded-full" disabled={pending || !content.trim()} type="submit" aria-label="Send message"><Send size={17} aria-hidden="true" /></button></form>;
}

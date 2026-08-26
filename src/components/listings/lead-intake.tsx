"use client";

import { MessageCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LeadIntake({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch(`/api/listings/${listingId}/lead`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))) });
    const result = await response.json().catch(() => null);
    if (response.status === 401) {
      router.push("/auth/sign-in");
      return;
    }
    if (!response.ok) {
      setError(result?.error ?? "We could not start the conversation.");
      setPending(false);
      return;
    }
    router.push(`/student/chats/${result.conversationId}`);
  }

  if (!open) return <button className="button button-primary w-full" type="button" onClick={() => setOpen(true)}><MessageCircle size={19} aria-hidden="true" />Chat with agent</button>;
  return <form className="glass-surface mt-3 space-y-4 p-4" onSubmit={submit}><div className="flex items-center justify-between"><h2 className="font-semibold">Tell the agent what you need</h2><button className="flex size-10 items-center justify-center rounded-full" type="button" onClick={() => setOpen(false)} aria-label="Close enquiry form"><X size={18} aria-hidden="true" /></button></div><label className="block text-sm font-medium">Monthly budget<input className="glass-search mt-2 w-full px-3 py-3 outline-none" name="budget" type="number" min="0" placeholder="150000" /></label><label className="block text-sm font-medium">Move-in date<input className="glass-search mt-2 w-full px-3 py-3 outline-none" name="moveInDate" type="date" /></label><label className="block text-sm font-medium">Requirements<textarea className="glass-search mt-2 min-h-24 w-full resize-y px-3 py-3 outline-none" name="requirements" maxLength={1000} placeholder="Share anything important about the room you need." /></label>{error && <p className="text-sm text-[var(--danger)]" role="alert">{error}</p>}<button className="button button-primary w-full" disabled={pending} type="submit">{pending ? "Opening chat..." : "Start conversation"}</button></form>;
}

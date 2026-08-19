"use client";

import { CalendarDays, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function ViewingRequest({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const scheduledAt = new Date(`${values.date}T${values.time}`).toISOString();
    const response = await fetch(`/api/listings/${listingId}/viewing`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduledAt, notes: values.notes }) });
    const result = await response.json().catch(() => null);
    if (response.status === 401) {
      router.push("/auth/sign-in");
      return;
    }
    if (!response.ok) {
      setError(result?.error ?? "We could not request this viewing.");
      setPending(false);
      return;
    }
    setOpen(false);
    setPending(false);
    router.refresh();
  }

  if (!open) return <button className="button button-glass w-full" type="button" onClick={() => setOpen(true)}><CalendarDays size={18} aria-hidden="true" />Request a viewing</button>;
  return <form className="glass-surface mt-3 space-y-4 p-4" onSubmit={submit}><div className="flex items-center justify-between"><h2 className="font-semibold">Choose a viewing time</h2><button className="flex size-10 items-center justify-center rounded-full" type="button" onClick={() => setOpen(false)} aria-label="Close viewing form"><X size={18} aria-hidden="true" /></button></div><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm font-medium">Date<input className="glass-search mt-2 w-full px-3 py-3 outline-none" name="date" type="date" required /></label><label className="block text-sm font-medium">Time<input className="glass-search mt-2 w-full px-3 py-3 outline-none" name="time" type="time" required /></label></div><label className="block text-sm font-medium">Notes<textarea className="glass-search mt-2 min-h-20 w-full resize-y px-3 py-3 outline-none" name="notes" maxLength={1000} placeholder="Add a note for the agent." /></label>{error && <p className="text-sm text-red-600" role="alert">{error}</p>}<button className="button button-primary w-full" disabled={pending} type="submit">{pending ? "Requesting..." : "Send viewing request"}</button></form>;
}

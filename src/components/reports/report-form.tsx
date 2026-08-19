"use client";

import { Flag, X } from "lucide-react";
import { useState } from "react";

const reasons = ["INACCURATE", "SCAM", "DUPLICATE", "HARASSMENT", "OTHER"] as const;

export function ReportForm({ targetType, targetId }: { targetType: (typeof reasons)[number] extends never ? never : "LISTING" | "AGENT" | "USER" | "MESSAGE"; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof reasons)[number]>("INACCURATE");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetType, targetId, reason, description }) });
    const result = await response.json().catch(() => null);
    setStatus(response.ok ? "Report sent to our trust team." : result?.error ?? "Unable to send report.");
    setBusy(false);
    if (response.ok) setOpen(false);
  }

  if (!open) return <button className="button button-glass w-full" type="button" onClick={() => setOpen(true)}><Flag size={17} aria-hidden="true" />Report listing</button>;
  return <form className="glass-surface mt-3 space-y-4 p-4" onSubmit={submit}><div className="flex items-center justify-between"><h2 className="font-semibold">Report this listing</h2><button className="flex size-10 items-center justify-center rounded-full" type="button" onClick={() => setOpen(false)} aria-label="Close report form"><X size={18} aria-hidden="true" /></button></div><label className="block text-sm font-medium">Reason<select className="glass-search mt-2 w-full px-3 py-3 outline-none" value={reason} onChange={(event) => setReason(event.target.value as (typeof reasons)[number])}>{reasons.map((item) => <option key={item} value={item}>{item.toLowerCase()}</option>)}</select></label><label className="block text-sm font-medium">Details<textarea className="glass-search mt-2 min-h-24 w-full resize-y px-3 py-3 outline-none" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={2000} placeholder="Tell us what needs attention." /></label>{status && <p className="text-sm text-[var(--text-secondary)]" role="status">{status}</p>}<button className="button button-primary w-full" disabled={busy} type="submit">{busy ? "Sending..." : "Send report"}</button></form>;
}

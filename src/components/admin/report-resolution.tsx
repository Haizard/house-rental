"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ReportResolution({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function resolve(status: "RESOLVED" | "DISMISSED") {
    if (!resolution.trim()) {
      setError("Add a short resolution first.");
      return;
    }
    setBusy(true);
    setError("");
    const response = await fetch(`/api/admin/reports/${reportId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, resolution }) });
    if (response.ok) router.refresh();
    else setError((await response.json().catch(() => null))?.error ?? "Unable to update report.");
    setBusy(false);
  }

  return <div className="space-y-2"><label className="sr-only" htmlFor={`resolution-${reportId}`}>Resolution</label><input className="glass-search w-full px-3 py-2 text-sm outline-none" id={`resolution-${reportId}`} value={resolution} onChange={(event) => setResolution(event.target.value)} placeholder="Add resolution" maxLength={2000} />{error && <p className="text-xs text-red-600" role="alert">{error}</p>}<div className="flex gap-2"><button className="button button-primary flex-1 px-3 text-sm" disabled={busy} type="button" onClick={() => resolve("RESOLVED")}><Check size={16} aria-hidden="true" />Resolve</button><button className="button button-glass flex-1 px-3 text-sm" disabled={busy} type="button" onClick={() => resolve("DISMISSED")}><X size={16} aria-hidden="true" />Dismiss</button></div></div>;
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ViewingStatus({ viewingId, status }: { viewingId: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  async function update(nextStatus: string) {
    setPending(true);
    const response = await fetch(`/api/agent/viewings/${viewingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: nextStatus }) });
    if (response.ok) router.refresh();
    setPending(false);
  }
  if (status === "REQUESTED") return <div className="flex gap-2"><button className="button button-primary flex-1 px-3 text-sm" disabled={pending} type="button" onClick={() => update("ACCEPTED")}>Accept</button><button className="button button-glass flex-1 px-3 text-sm" disabled={pending} type="button" onClick={() => update("DECLINED")}>Decline</button></div>;
  if (status === "ACCEPTED") return <button className="button button-glass w-full px-3 text-sm" disabled={pending} type="button" onClick={() => update("COMPLETED")}>Mark completed</button>;
  return <span className="text-sm text-[var(--text-secondary)]">{status.toLowerCase()}</span>;
}

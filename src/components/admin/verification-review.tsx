"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function VerificationReview({ verificationId }: { verificationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function review(status: "APPROVED" | "REJECTED") {
    setBusy(true);
    const response = await fetch(`/api/admin/verification/${verificationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    if (response.ok) router.refresh();
    setBusy(false);
  }
  return <div className="flex gap-2 lg:flex-col"><button className="button button-primary min-h-11 flex-1 px-4 text-sm" disabled={busy} type="button" onClick={() => review("APPROVED")}><Check size={17} aria-hidden="true" />Approve</button><button className="button button-glass min-h-11 flex-1 px-4 text-sm" disabled={busy} type="button" onClick={() => review("REJECTED")}><X size={17} aria-hidden="true" />Reject</button></div>;
}

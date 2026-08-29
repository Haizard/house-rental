"use client";

import { Check, X, ExternalLink, FileText, ZoomIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type VerificationData = {
  id: string;
  notes: string | null;
  evidence: string[];
  targetType: string;
  createdAt: string;
  agent?: {
    businessName: string;
    userId: string;
    user: { firstName: string; lastName: string; email: string | null };
  };
};

interface VerificationReviewProps {
  verificationId: string;
  data?: VerificationData;
}

export function VerificationReview({ verificationId, data }: VerificationReviewProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  async function review(status: "APPROVED" | "REJECTED") {
    setBusy(true);
    const response = await fetch(`/api/admin/verification/${verificationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes: notes || undefined }),
    });
    if (response.ok) router.refresh();
    setBusy(false);
  }

  return (
    <div className="space-y-4">
      {/* Agent info */}
      {data?.agent && (
        <div className="glass-surface p-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {data.agent.businessName}
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            {data.agent.user.firstName} {data.agent.user.lastName}
          </p>
          {data.agent.user.email && (
            <p className="text-xs text-[var(--text-tertiary)]">{data.agent.user.email}</p>
          )}
        </div>
      )}

      {/* Notes */}
      {data?.notes && (
        <div className="glass-surface p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Agent Notes
          </h4>
          <p className="text-sm text-[var(--text-primary)]">{data.notes}</p>
        </div>
      )}

      {/* Documents — side-by-side comparison */}
      {data?.evidence && data.evidence.length > 0 && (
        <div className="glass-surface p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Uploaded Documents ({data.evidence.length})
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.evidence.map((url, i) => (
              <div
                className="group relative overflow-hidden rounded-xl border border-[var(--glass-border)]"
                key={i}
              >
                {url.endsWith(".pdf") ? (
                  <div className="flex min-h-[200px] items-center justify-center bg-[var(--accent-soft)] p-4">
                    <FileText size={32} className="text-[var(--accent)]" />
                    <span className="ml-2 text-sm text-[var(--text-secondary)]">PDF Document</span>
                  </div>
                ) : (
                  <img
                    src={url}
                    alt={`Verification document ${i + 1}`}
                    className="min-h-[200px] w-full object-cover"
                  />
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-9 items-center justify-center rounded-full bg-white/90 text-[var(--text-primary)] shadow-lg"
                  >
                    <ZoomIn size={16} />
                  </a>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-9 items-center justify-center rounded-full bg-white/90 text-[var(--text-primary)] shadow-lg"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                  <p className="text-[10px] font-medium text-white">
                    Document {i + 1}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin notes */}
      <div className="glass-surface p-4">
        <label className="block text-sm font-medium">
          Admin Notes (optional)
          <textarea
            className="glass-search mt-2 min-h-16 w-full resize-y px-3 py-2 text-sm outline-none"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this verification..."
            maxLength={500}
          />
        </label>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          className="button button-primary h-9 flex-1 px-4 text-sm"
          disabled={busy}
          type="button"
          onClick={() => review("APPROVED")}
        >
          <Check size={17} aria-hidden="true" />
          Approve
        </button>
        <button
          className="button button-glass h-9 flex-1 px-4 text-sm"
          disabled={busy}
          type="button"
          onClick={() => review("REJECTED")}
        >
          <X size={17} aria-hidden="true" />
          Reject
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { DocumentUpload } from "./document-upload";

type UploadedDoc = {
  url: string;
  storageKey: string;
  label: string;
  type: "license" | "id" | "other";
};

export function VerificationForm({ pending }: { pending: boolean }) {
  const [message, setMessage] = useState("");
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [status, setStatus] = useState(pending ? "A review is already pending." : "");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("");

    const response = await fetch("/api/agent/verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        notes: message,
        evidence: documents.map((d) => d.url),
      }),
    });
    const result = await response.json().catch(() => null);
    setStatus(
      response.ok
        ? "Application submitted for review."
        : result?.error ?? "Unable to submit application."
    );
    setBusy(false);
  }

  if (pending) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        Your verification application is under review.
      </p>
    );
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <label className="block text-sm font-medium">
        Verification notes
        <textarea
          className="glass-search mt-2 min-h-24 w-full resize-y px-3 py-3 outline-none"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          minLength={20}
          maxLength={2000}
          placeholder="Tell us about your agency and the areas you serve."
          required
        />
      </label>

      <DocumentUpload
        documents={documents}
        onDocumentsChange={setDocuments}
        maxDocs={3}
      />

      {status && (
        <p className="text-sm text-[var(--text-secondary)]" role="status">
          {status}
        </p>
      )}

      <button
        className="button button-primary px-4"
        disabled={busy || documents.length === 0}
        type="submit"
      >
        {busy ? "Submitting..." : "Submit for review"}
      </button>
    </form>
  );
}

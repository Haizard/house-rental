"use client";

import { Upload, FileText, X, Loader2 } from "lucide-react";
import { useState, useRef } from "react";

type UploadedDoc = {
  url: string;
  storageKey: string;
  label: string;
  type: "license" | "id" | "other";
};

interface DocumentUploadProps {
  documents: UploadedDoc[];
  onDocumentsChange: (docs: UploadedDoc[]) => void;
  maxDocs?: number;
}

export function DocumentUpload({
  documents,
  onDocumentsChange,
  maxDocs = 3,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)) {
      setError("Only JPEG, PNG, WebP, or PDF files are accepted");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("purpose", "verification");

      const res = await fetch("/api/agent/verification/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        setUploading(false);
        return;
      }

      const docType: UploadedDoc["type"] =
        file.name.toLowerCase().includes("license") ? "license" :
        file.name.toLowerCase().includes("id") ? "id" : "other";

      onDocumentsChange([
        ...documents,
        { url: data.url, storageKey: data.storageKey, label: file.name, type: docType },
      ]);
    } catch {
      setError("Upload failed. Please try again.");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeDoc(index: number) {
    onDocumentsChange(documents.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--text-primary)]">
          Verification Documents
        </label>
        <span className="text-[11px] text-[var(--text-tertiary)]">
          {documents.length}/{maxDocs}
        </span>
      </div>

      <p className="text-xs text-[var(--text-secondary)]">
        Upload your business license or national ID. This helps us verify your identity.
      </p>

      {/* Uploaded documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc, i) => (
            <div
              className="flex items-center gap-3 rounded-xl bg-[var(--accent-soft)] px-3 py-2.5"
              key={i}
            >
              <FileText size={16} className="shrink-0 text-[var(--accent)]" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                  {doc.label}
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)]">
                  {doc.type === "license" ? "Business License" : doc.type === "id" ? "National ID" : "Document"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeDoc(i)}
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-red-50 hover:text-red-500"
                aria-label={`Remove ${doc.label}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {documents.length < maxDocs && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleUpload}
            className="hidden"
            id="doc-upload"
          />
          <label
            htmlFor="doc-upload"
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--glass-border)] px-4 py-5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] ${
              uploading ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload document (JPEG, PNG, PDF — max 5MB)
              </>
            )}
          </label>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500" role="alert">{error}</p>
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Film, Trash2, Upload, X } from "lucide-react";
import { FormEvent, useState } from "react";

type ExistingVideo = { id: string; url: string; storageKey: string };

interface Props {
  listingId: string;
  existingVideos: ExistingVideo[];
}

export function VideoUpload({ listingId, existingVideos }: Props) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = form.elements.namedItem("video") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError("Video must be under 50MB.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/agent/listings/${listingId}/videos`, {
        method: "POST",
        body: formData,
      });

      if (res.status === 401) {
        router.push("/auth/sign-in");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Upload failed.");
        return;
      }

      form.reset();
      router.refresh();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(videoId: string) {
    try {
      const res = await fetch(
        `/api/agent/listings/${listingId}/videos?id=${videoId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // silently fail
    }
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-[var(--text-primary)]">
        Videos
      </h3>
      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
        Upload short videos of the property. Max 50MB per video.
      </p>

      {/* Existing videos */}
      {existingVideos.length > 0 && (
        <div className="mt-3 space-y-2">
          {existingVideos.map((video) => (
            <div
              key={video.id}
              className="flex items-center justify-between rounded-xl bg-white/30 p-3"
            >
              <div className="flex items-center gap-2 text-sm">
                <Film size={16} className="text-[var(--accent)]" />
                <span className="truncate max-w-[200px]">
                  {video.url.split("/").pop()}
                </span>
              </div>
              <button
                className="text-red-500 hover:text-red-700"
                onClick={() => handleDelete(video.id)}
                type="button"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload form */}
      <form className="mt-3" onSubmit={handleUpload}>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white/20 p-4 text-sm text-[var(--text-secondary)] transition hover:border-[var(--accent)] hover:bg-white/30">
          <Upload size={18} />
          <span>{uploading ? "Uploading…" : "Select video"}</span>
          <input
            accept="video/*"
            className="hidden"
            disabled={uploading}
            name="video"
            type="file"
          />
        </label>
      </form>

      {error && (
        <p className="mt-2 flex items-center gap-1 text-xs text-red-500">
          <X size={12} /> {error}
        </p>
      )}
    </div>
  );
}

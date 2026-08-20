"use client";

import Image from "next/image";
import { GripVertical, Trash2, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type UploadedImage = {
  id: string;
  url: string;
  sortOrder: number;
  isPrimary: boolean;
};

export function ImageUpload({
  listingId,
  existingImages = [],
  onImagesChange,
}: {
  listingId: string;
  existingImages?: UploadedImage[];
  onImagesChange?: (images: UploadedImage[]) => void;
}) {
  const [images, setImages] = useState<UploadedImage[]>(existingImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateImages = useCallback(
    (next: UploadedImage[]) => {
      setImages(next);
      onImagesChange?.(next);
    },
    [onImagesChange],
  );

  async function uploadFile(file: File) {
    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`/api/agent/listings/${listingId}/images`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setError(result?.error ?? "Upload failed.");
      setUploading(false);
      return;
    }

    updateImages([...images, result.data]);
    setUploading(false);
  }

  async function handleDelete(imageId: string) {
    const response = await fetch(`/api/agent/listings/${listingId}/images`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageId }),
    });
    if (response.ok) {
      updateImages(images.filter((img) => img.id !== imageId));
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    // Upload files sequentially to avoid overwhelming the server
    Array.from(files).forEach((file) => uploadFile(file));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <button
        className={`glass-surface flex w-full flex-col items-center justify-center gap-3 p-8 text-center transition-colors ${
          dragOver
            ? "border-2 border-dashed border-[var(--accent)] bg-[var(--accent-soft)]"
            : "border-2 border-dashed border-[var(--glass-border)] hover:border-[var(--accent)]"
        }`}
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Upload size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium">
            {uploading ? "Uploading..." : "Tap to upload or drag photos here"}
          </p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            JPEG, PNG, WebP or AVIF · Max 5 MB each · Up to {12 - images.length} more
          </p>
        </div>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
      </button>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Image grid — 2-col mobile per design system §8 */}
      {images.length > 0 && (
        <div className="listing-grid">
          {images.map((image, index) => (
            <div className="listing-card relative" key={image.id}>
              <div className="relative aspect-[4/3]">
                <Image
                  className="listing-image"
                  src={image.url}
                  alt={`Listing photo ${index + 1}`}
                  fill
                  sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
                />
                {image.isPrimary && (
                  <span className="badge">Primary</span>
                )}
                {/* Order indicator */}
                <span className="absolute left-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-[10px] font-bold text-white">
                  {index + 1}
                </span>
                {/* Delete button */}
                <button
                  className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-[var(--danger)]"
                  type="button"
                  onClick={() => handleDelete(image.id)}
                  aria-label={`Delete photo ${index + 1}`}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-[var(--text-tertiary)]">
          {images.length} photo{images.length !== 1 ? "s" : ""} · The first
          photo is the primary image shown in search results.
        </p>
      )}
    </div>
  );
}

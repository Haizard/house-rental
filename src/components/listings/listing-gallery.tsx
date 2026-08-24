"use client";

import Image from "next/image";
import { useState } from "react";
import { GalleryLightbox } from "./gallery-lightbox";

type GalleryImage = { id: string; url: string; isPrimary?: boolean; sortOrder?: number };

interface ListingGalleryProps {
  images: GalleryImage[];
  title: string;
}

export function ListingGallery({ images, title }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Sort: primary first, then by sortOrder
  const sorted = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  if (!sorted.length) return null;

  return (
    <div>
      {/* Hero image — click to open lightbox */}
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="relative block aspect-[4/3] w-full overflow-hidden sm:aspect-[16/10]"
        aria-label="Open image gallery"
      >
        <Image
          src={sorted[activeIndex].url}
          alt={title}
          fill
          priority
          className="object-cover transition-opacity duration-200"
          sizes="(max-width: 1023px) 100vw, 65vw"
        />
      </button>

      {/* Thumbnail strip — small images in one row on mobile */}
      {sorted.length > 1 && (
        <div className="flex gap-1 p-1">
          {sorted.slice(0, 8).map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => { setActiveIndex(i); setLightboxOpen(true); }}
              className={`relative aspect-[4/3] flex-1 overflow-hidden rounded-lg transition-all duration-150 ${
                i === activeIndex
                  ? "ring-2 ring-[var(--accent)] ring-offset-1"
                  : "opacity-70 hover:opacity-100"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                className="object-cover"
                sizes="120px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <GalleryLightbox
        images={sorted}
        initialIndex={activeIndex}
        title={title}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}

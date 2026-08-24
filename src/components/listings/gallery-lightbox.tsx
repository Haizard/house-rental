"use client";

import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

type GalleryImage = { id: string; url: string; isPrimary?: boolean; sortOrder?: number };

interface GalleryLightboxProps {
  images: GalleryImage[];
  initialIndex?: number;
  title: string;
  open: boolean;
  onClose: () => void;
}

export function GalleryLightbox({
  images,
  initialIndex = 0,
  title,
  open,
  onClose,
}: GalleryLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchDelta, setTouchDelta] = useState({ x: 0, y: 0 });
  const [isSwiping, setIsSwiping] = useState(false);
  const [scale, setScale] = useState(1);
  const [lastPinchDistance, setLastPinchDistance] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort: primary first, then by sortOrder
  const sorted = [...images].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  const goNext = useCallback(() => {
    if (currentIndex < sorted.length - 1) {
      setCurrentIndex((i) => i + 1);
      setScale(1);
    }
  }, [currentIndex, sorted.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setScale(1);
    }
  }, [currentIndex]);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, goNext, goPrev]);

  // Reset index when opening
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setScale(1);
    }
  }, [open, initialIndex]);

  if (!open || !sorted.length) return null;

  // Touch handlers for swipe
  function handleTouchStart(e: React.TouchEvent) {
    if (scale > 1) return; // don't swipe when zoomed
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchDelta({ x: 0, y: 0 });
    setIsSwiping(false);
  }

  function handleTouchMove(e: React.TouchEvent) {
    // Pinch zoom
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (lastPinchDistance !== null) {
        const delta = distance - lastPinchDistance;
        setScale((s) => Math.min(Math.max(s + delta * 0.005, 1), 3));
      }
      setLastPinchDistance(distance);
      return;
    }

    if (!touchStart || scale > 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStart.x;
    const dy = touch.clientY - touchStart.y;
    setTouchDelta({ x: dx, y: dy });
    setIsSwiping(Math.abs(dx) > 10);
  }

  function handleTouchEnd() {
    setLastPinchDistance(null);
    if (scale > 1) return;

    const threshold = 60;
    // Swipe down to close
    if (touchDelta.y > threshold && Math.abs(touchDelta.y) > Math.abs(touchDelta.x)) {
      onClose();
      return;
    }
    // Swipe left/right to navigate
    if (touchDelta.x < -threshold) {
      goNext();
    } else if (touchDelta.x > threshold) {
      goPrev();
    }
    setTouchStart(null);
    setTouchDelta({ x: 0, y: 0 });
    setIsSwiping(false);
  }

  const swipeOffset = isSwiping ? touchDelta.x : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90"
      onClick={onClose}
      ref={containerRef}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3">
        <p className="max-w-[60%] truncate text-sm font-medium text-white/90">
          {title}
        </p>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/60">
            {currentIndex + 1} / {sorted.length}
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            aria-label="Close gallery"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="flex h-full w-full items-center justify-center px-12 py-16 sm:px-16"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sorted[currentIndex].url}
          alt={`${title} - Image ${currentIndex + 1}`}
          className="max-h-full max-w-full select-none object-contain transition-transform duration-150"
          style={{
            transform: `translateX(${swipeOffset}px) scale(${scale})`,
            transition: isSwiping ? "none" : "transform 0.2s ease",
          }}
          draggable={false}
        />
      </div>

      {/* Navigation arrows (desktop) */}
      {currentIndex > 0 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          className="absolute left-2 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:left-4"
          aria-label="Previous image"
        >
          <ChevronLeft size={24} />
        </button>
      )}
      {currentIndex < sorted.length - 1 && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          className="absolute right-2 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:right-4"
          aria-label="Next image"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Bottom dots */}
      {sorted.length > 1 && sorted.length <= 12 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          {sorted.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); setScale(1); }}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                i === currentIndex ? "w-6 bg-white" : "w-1.5 bg-white/40"
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

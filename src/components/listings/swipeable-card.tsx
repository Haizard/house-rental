"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { MapPin, Heart, X, ChevronUp } from "lucide-react";
import Image from "next/image";
import type { Listing } from "@/lib/listings";
import { VerifiedBadge } from "@/components/ui/verified-badge";

type SwipeAction = "save" | "dismiss" | "details";

type SwipeableCardProps = {
  listing: Listing;
  onSwipe: (action: SwipeAction, listingId: string) => void;
  style?: React.CSSProperties;
};

const SWIPE_THRESHOLD = 80;
const ROTATION_FACTOR = 0.1;

export function SwipeableCard({ listing, onSwipe, style }: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0 });
  const price = new Intl.NumberFormat("en-TZ").format(listing.price);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "mouse") return; // Only handle touch
    startRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      setDragOffset({ x: dx, y: dy });
    },
    [isDragging]
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const { x, y } = dragOffset;

    if (Math.abs(x) > SWIPE_THRESHOLD && Math.abs(x) > Math.abs(y)) {
      // Horizontal swipe
      onSwipe(x > 0 ? "save" : "dismiss", listing.id);
    } else if (y < -SWIPE_THRESHOLD && Math.abs(y) > Math.abs(x)) {
      // Swipe up
      onSwipe("details", listing.id);
    } else {
      // Snap back
      setDragOffset({ x: 0, y: 0 });
    }
  }, [isDragging, dragOffset, listing.id, onSwipe]);

  const rotation = dragOffset.x * ROTATION_FACTOR;
  const opacity = Math.max(0.3, 1 - Math.abs(dragOffset.y) / 300);

  // Visual feedback based on drag direction
  const showSave = dragOffset.x > 40;
  const showDismiss = dragOffset.x < -40;
  const showDetails = dragOffset.y < -40;

  return (
    <div
      ref={cardRef}
      className="relative select-none touch-pan-y"
      style={{
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
        opacity: isDragging ? opacity : 1,
        transition: isDragging ? "none" : "transform 0.3s ease, opacity 0.3s ease",
        ...style,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Swipe indicators */}
      {showSave && (
        <div className="absolute -left-2 top-4 z-10 -rotate-12 rounded-lg border-2 border-[#FBC618] bg-[#FBC618]/20 px-4 py-2 text-lg font-bold text-[#FBC618] backdrop-blur-sm">
          💚 SAVE
        </div>
      )}
      {showDismiss && (
        <div className="absolute -right-2 top-4 z-10 rotate-12 rounded-lg border-2 border-red-500 bg-red-500/20 px-4 py-2 text-lg font-bold text-red-500 backdrop-blur-sm">
          PASS ✕
        </div>
      )}
      {showDetails && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-lg border-2 border-[#FBC618] bg-[#FBC618]/20 px-4 py-2 text-lg font-bold text-[#FBC618] backdrop-blur-sm">
          🔍 DETAILS
        </div>
      )}

      {/* Card content */}
      <div className="listing-card overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Link href={`/listings/${listing.id}`} aria-label={`View ${listing.title}`}>
            <Image
              className="listing-image"
              src={listing.image}
              alt={listing.title}
              fill
              sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
              draggable={false}
            />
            {listing.verified && (
              <VerifiedBadge size="sm" className="absolute left-2 top-2" />
            )}
          </Link>
        </div>
        <Link className="block listing-content overflow-hidden" href={`/listings/${listing.id}`}>
          <p className="listing-title">{listing.title}</p>
          <p className="listing-meta flex items-center gap-1">
            <MapPin size={12} aria-hidden="true" />
            {listing.type} · {listing.area}
          </p>
          <p className="price">
            TZS {price}
            <span className="text-xs font-normal text-[var(--text-secondary)]"> / mo</span>
          </p>
        </Link>
      </div>
    </div>
  );
}

// ─── Swipe Stack (mobile-only overlay) ───

export function SwipeableListingStack({
  listings,
  onAction,
}: {
  listings: Listing[];
  onAction: (action: SwipeAction, listingId: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | "up" | null>(null);

  const handleSwipe = useCallback(
    (action: SwipeAction, listingId: string) => {
      if (action === "details") {
        // Navigate — don't advance the stack
        return;
      }
      setExitDirection(action === "save" ? "right" : "left");
      onAction(action, listingId);

      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setExitDirection(null);
      }, 300);
    },
    [onAction]
  );

  const remaining = listings.slice(currentIndex);

  if (remaining.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 text-5xl">🏠</div>
        <h3 className="text-lg font-bold text-[var(--text-primary)]">
          No more listings
        </h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          You&apos;ve seen all available listings. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-[420px] w-full max-w-sm">
      {/* Stacked cards (behind) */}
      {remaining.slice(0, 3).reverse().map((listing, i) => {
        const stackIndex = remaining.length - 1 - i;
        const scale = 1 - stackIndex * 0.05;
        const translateY = stackIndex * 8;

        return (
          <div
            key={listing.id}
            className="absolute inset-0"
            style={{
              transform: `scale(${scale}) translateY(${translateY}px)`,
              zIndex: stackIndex,
              opacity: stackIndex > 2 ? 0 : 1,
            }}
          >
            <SwipeableCard listing={listing} onSwipe={() => {}} />
          </div>
        );
      })}

      {/* Top card (interactive) */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 10,
          transform: exitDirection === "right"
            ? "translateX(120%) rotate(20deg)"
            : exitDirection === "left"
            ? "translateX(-120%) rotate(-20deg)"
            : "none",
          opacity: exitDirection ? 0 : 1,
          transition: exitDirection ? "all 0.3s ease" : "none",
        }}
      >
        <SwipeableCard
          listing={remaining[0]}
          onSwipe={handleSwipe}
        />
      </div>

      {/* Action buttons */}
      <div className="absolute -bottom-16 left-0 right-0 z-20 flex justify-center gap-6">
        <button
          onClick={() => handleSwipe("dismiss", remaining[0].id)}
          className="flex size-14 items-center justify-center rounded-full border-2 border-red-400 bg-red-500/10 text-red-400 shadow-lg transition hover:bg-red-500/20 hover:scale-110"
          aria-label="Pass"
        >
          <X size={24} />
        </button>
        <button
          onClick={() => handleSwipe("details", remaining[0].id)}
          className="flex size-14 items-center justify-center rounded-full border-2 border-[#ED8023] bg-[#FBC618]/10 text-[#ED8023] shadow-lg transition hover:bg-[#FBC618]/20 hover:scale-110"
          aria-label="View details"
        >
          <ChevronUp size={24} />
        </button>
        <button
          onClick={() => handleSwipe("save", remaining[0].id)}
          className="flex size-14 items-center justify-center rounded-full border-2 border-[#ED8023] bg-[#FBC618]/10 text-[#ED8023] shadow-lg transition hover:bg-[#FBC618]/20 hover:scale-110"
          aria-label="Save"
        >
          <Heart size={24} />
        </button>
      </div>

      {/* Counter */}
      <div className="absolute -top-8 right-0 text-sm text-[var(--text-tertiary)]">
        {currentIndex + 1} / {listings.length}
      </div>
    </div>
  );
}

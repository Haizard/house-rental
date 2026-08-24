"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      {/* Light scrim per design system §6 */}
      <div className="absolute inset-0 bg-[rgba(242,244,248,0.6)]" />

      <div
        className="glass-surface relative w-full max-w-lg rounded-b-none animate-scale-in sm:rounded-[22px]"
        onClick={(e) => e.stopPropagation()}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-[var(--text-tertiary)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          {title && (
            <h2 className="text-lg font-semibold">{title}</h2>
          )}
          <button
            className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--accent-soft)]"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto px-5 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}

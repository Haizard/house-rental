"use client";

import { X, ArrowRight } from "lucide-react";
import Link from "next/link";

type CompareItem = { id: string; title: string };

interface CompareBarProps {
  items: CompareItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

/**
 * Floating bottom bar showing selected listings for comparison.
 * Appears when 1+ listings are selected, with "Compare" button enabled at 2+.
 */
export function CompareBar({ items, onRemove, onClear }: CompareBarProps) {
  if (items.length === 0) return null;

  const compareUrl = `/compare?ids=${items.map((i) => i.id).join(",")}`;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 animate-slide-up sm:bottom-6 sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2">
      <div className="glass-surface flex items-center gap-3 px-4 py-3">
        {/* Selected items */}
        <div className="flex flex-1 items-center gap-2 overflow-hidden">
          {items.map((item) => (
            <span
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--accent)]"
              key={item.id}
            >
              <span className="max-w-[80px] truncate">{item.title}</span>
              <button
                type="button"
                onClick={() => onRemove(item.id)}
                className="flex size-3.5 items-center justify-center rounded-full hover:bg-[var(--accent)]/20"
                aria-label={`Remove ${item.title} from comparison`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            Clear
          </button>
          {items.length >= 2 && (
            <Link
              href={compareUrl}
              className="button button-primary min-h-8 px-3 text-[11px]"
            >
              Compare ({items.length}) <ArrowRight size={12} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

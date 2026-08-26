import { type LucideIcon } from "lucide-react";

/**
 * iOS-style icon badge — a rounded-square container with gradient background
 * and subtle shadow, like native iOS app icons.
 */

const GRADIENT_PRESETS = {
  blue: "from-[#FBC618] to-[#ED8023]",
  green: "from-[#2E7D32] to-[#1B5E20]",
  orange: "from-[#ED8023] to-[#D32F2F]",
  red: "from-[#D32F2F] to-[#B71C1C]",
  purple: "from-[#42A5F5] to-[#1E88E5]",
  teal: "from-[#42A5F5] to-[#1E88E5]",
  pink: "from-[#FF2D55] to-[#FF375F]",
  indigo: "from-[#5856D6] to-[#AF52DE]",
  gray: "from-[#8E8E93] to-[#636366]",
  accent: "from-[var(--accent)] to-[#ED8023]",
} as const;

type GradientKey = keyof typeof GRADIENT_PRESETS;

interface IconBadgeProps {
  icon: LucideIcon;
  /** Gradient preset name or custom Tailwind gradient classes */
  gradient?: GradientKey | string;
  /** Icon size in px (default 20) */
  iconSize?: number;
  /** Container size class (default size-10) */
  size?: string;
  /** Optional label below the icon */
  label?: string;
  /** Additional classes on the container */
  className?: string;
}

export function IconBadge({
  icon: Icon,
  gradient = "accent",
  iconSize = 20,
  size = "size-10",
  label,
  className = "",
}: IconBadgeProps) {
  const gradientClass = GRADIENT_PRESETS[gradient as GradientKey] ?? gradient;

  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <div
        className={`${size} flex shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-gradient-to-br ${gradientClass} text-white shadow-lg shadow-black/10`}
      >
        <Icon size={iconSize} strokeWidth={2} aria-hidden="true" />
      </div>
      {label && (
        <span className="text-[10px] font-medium text-[var(--text-secondary)] sm:text-xs">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Inline icon badge — smaller, used inside cards and list rows
 */
export function IconBadgeInline({
  icon: Icon,
  gradient = "accent",
  iconSize = 16,
  size = "size-8",
}: {
  icon: LucideIcon;
  gradient?: GradientKey | string;
  iconSize?: number;
  size?: string;
}) {
  const gradientClass = GRADIENT_PRESETS[gradient as GradientKey] ?? gradient;

  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-[8px] bg-gradient-to-br ${gradientClass} text-white shadow-md shadow-black/8`}
    >
      <Icon size={iconSize} strokeWidth={2} aria-hidden="true" />
    </div>
  );
}

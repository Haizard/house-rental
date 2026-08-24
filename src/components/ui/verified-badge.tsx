import { ShieldCheck } from "lucide-react";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Verified badge showing a shield icon with "Verified" text.
 * Used on listings and agent profiles.
 */
export function VerifiedBadge({ size = "sm", className = "" }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "gap-1 px-2 py-0.5 text-[10px]",
    md: "gap-1.5 px-2.5 py-1 text-[11px]",
    lg: "gap-2 px-3 py-1.5 text-xs",
  };

  const iconSizes = { sm: 11, md: 13, lg: 15 };

  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-sm ${sizeClasses[size]} ${className}`}
    >
      <ShieldCheck size={iconSizes[size]} aria-hidden="true" />
      Verified
    </span>
  );
}

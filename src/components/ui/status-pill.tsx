import type { ListingStatus } from "@/generated/prisma/enums";

const statusConfig: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  ACTIVE: { bg: "var(--success-soft, rgba(52,199,89,.14))", text: "var(--success, #34C759)", label: "Active" },
  DRAFT: { bg: "var(--warning-soft, rgba(255,159,10,.16))", text: "var(--warning, #FF9F0A)", label: "Draft" },
  PENDING_REVIEW: { bg: "var(--warning-soft, rgba(255,159,10,.16))", text: "var(--warning, #FF9F0A)", label: "Pending review" },
  PAUSED: { bg: "var(--warning-soft, rgba(255,159,10,.16))", text: "var(--warning, #FF9F0A)", label: "Paused" },
  RENTED: { bg: "var(--success-soft, rgba(52,199,89,.14))", text: "var(--success, #34C759)", label: "Rented" },
  EXPIRED: { bg: "var(--danger-soft, rgba(255,59,48,.14))", text: "var(--danger, #FF3B30)", label: "Expired" },
  REJECTED: { bg: "var(--danger-soft, rgba(255,59,48,.14))", text: "var(--danger, #FF3B30)", label: "Rejected" },
  NEW: { bg: "var(--warning-soft, rgba(255,159,10,.16))", text: "var(--warning, #FF9F0A)", label: "New" },
  CONTACTED: { bg: "rgba(90,200,250,.14)", text: "var(--info, #5AC8FA)", label: "Contacted" },
  VIEWING_REQUESTED: { bg: "rgba(90,200,250,.14)", text: "var(--info, #5AC8FA)", label: "Viewing requested" },
  VIEWING_CONFIRMED: { bg: "var(--success-soft, rgba(52,199,89,.14))", text: "var(--success, #34C759)", label: "Confirmed" },
  VIEWED: { bg: "rgba(90,200,250,.14)", text: "var(--info, #5AC8FA)", label: "Viewed" },
  NEGOTIATING: { bg: "rgba(90,200,250,.14)", text: "var(--info, #5AC8FA)", label: "Negotiating" },
  CLOSED: { bg: "var(--danger-soft, rgba(255,59,48,.14))", text: "var(--danger, #FF3B30)", label: "Closed" },
  LOST: { bg: "var(--danger-soft, rgba(255,59,48,.14))", text: "var(--danger, #FF3B30)", label: "Lost" },
  CANCELLED: { bg: "var(--danger-soft, rgba(255,59,48,.14))", text: "var(--danger, #FF3B30)", label: "Cancelled" },
  REQUESTED: { bg: "var(--warning-soft, rgba(255,159,10,.16))", text: "var(--warning, #FF9F0A)", label: "Requested" },
  ACCEPTED: { bg: "var(--success-soft, rgba(52,199,89,.14))", text: "var(--success, #34C759)", label: "Accepted" },
  DECLINED: { bg: "var(--danger-soft, rgba(255,59,48,.14))", text: "var(--danger, #FF3B30)", label: "Declined" },
  COMPLETED: { bg: "var(--success-soft, rgba(52,199,89,.14))", text: "var(--success, #34C759)", label: "Completed" },
  NO_SHOW: { bg: "var(--danger-soft, rgba(255,59,48,.14))", text: "var(--danger, #FF3B30)", label: "No show" },
};

const fallback = { bg: "rgba(142,142,147,.12)", text: "var(--text-secondary, rgba(60,60,67,.68))", label: "Unknown" };

export function StatusPill({ status }: { status: string }) {
  const config = statusConfig[status] ?? { ...fallback, label: status.replaceAll("_", " ").toLowerCase() };
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold leading-5"
      style={{ background: config.bg, color: config.text }}
    >
      {config.label}
    </span>
  );
}

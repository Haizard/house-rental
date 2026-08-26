"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  User,
  MapPin,
  Check,
  X,
  CircleDot,
} from "lucide-react";

type Viewing = {
  id: string;
  scheduledAt: string | null;
  status: string;
  notes: string | null;
  studentName: string;
  studentEmail: string;
  listingTitle: string;
  listingArea: string;
};

type Listing = { id: string; title: string };

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  ACCEPTED: "bg-[#FBC618]/100/20 text-[#ED8023] border-[#FBC618]/30",
  DECLINED: "bg-red-500/20 text-red-400 border-red-500/30",
  COMPLETED: "bg-[#FBC618]/100/20 text-[#ED8023] border-[#FBC618]/30",
  CANCELLED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  NO_SHOW: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const STATUS_ICONS: Record<string, typeof Check> = {
  REQUESTED: CircleDot,
  ACCEPTED: Check,
  DECLINED: X,
  COMPLETED: Check,
  CANCELLED: X,
};

export function AgentCalendarView({
  viewings,
  listings,
}: {
  viewings: Viewing[];
  listings: Listing[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Group viewings by date
  const viewingsByDate = useMemo(() => {
    const map: Record<string, Viewing[]> = {};
    for (const v of viewings) {
      if (!v.scheduledAt) continue;
      const d = new Date(v.scheduledAt);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(v);
    }
    return map;
  }, [viewings]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [currentMonth]);

  const selectedDayViewings = useMemo(() => {
    if (!selectedDate) return [];
    const key = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, "0")}-${selectedDate.getDate().toString().padStart(2, "0")}`;
    return viewingsByDate[key] || [];
  }, [selectedDate, viewingsByDate]);

  // Stats
  const thisMonthViewings = useMemo(() => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    return viewings.filter((v) => {
      if (!v.scheduledAt) return false;
      const d = new Date(v.scheduledAt);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  }, [viewings, currentMonth]);

  const pendingCount = thisMonthViewings.filter(
    (v) => v.status === "REQUESTED"
  ).length;
  const acceptedCount = thisMonthViewings.filter(
    (v) => v.status === "ACCEPTED"
  ).length;
  const completedCount = thisMonthViewings.filter(
    (v) => v.status === "COMPLETED"
  ).length;

  async function updateViewingStatus(id: string, status: string) {
    setUpdatingId(id);
    try {
      await fetch(`/api/agent/viewings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      // Reload to reflect changes
      window.location.reload();
    } catch {
      setUpdatingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-sm font-medium text-[var(--text-tertiary)]">Agent</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
          Viewing Calendar
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Manage your scheduled property viewings
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="glass-surface p-4 text-center">
          <p className="text-xs font-medium text-[var(--text-tertiary)]">
            Pending
          </p>
          <p className="mt-1 text-2xl font-bold text-yellow-400">
            {pendingCount}
          </p>
        </div>
        <div className="glass-surface p-4 text-center">
          <p className="text-xs font-medium text-[var(--text-tertiary)]">
            Accepted
          </p>
          <p className="mt-1 text-2xl font-bold text-[#ED8023]">
            {acceptedCount}
          </p>
        </div>
        <div className="glass-surface p-4 text-center">
          <p className="text-xs font-medium text-[var(--text-tertiary)]">
            Completed
          </p>
          <p className="mt-1 text-2xl font-bold text-[#ED8023]">
            {completedCount}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
        {/* Calendar Grid */}
        <div className="glass-surface p-4">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() - 1
                  )
                )
              }
              className="flex size-8 items-center justify-center rounded-lg hover:bg-white/10"
            >
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {MONTH_NAMES[currentMonth.getMonth()]}{" "}
              {currentMonth.getFullYear()}
            </h3>
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(
                    currentMonth.getFullYear(),
                    currentMonth.getMonth() + 1
                  )
                )
              }
              className="flex size-8 items-center justify-center rounded-lg hover:bg-white/10"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="py-1 text-center text-[10px] font-semibold uppercase text-[var(--text-tertiary)]"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`p-${i}`} />;

              const dayTime = day.getTime();
              const isToday = dayTime === today.getTime();
              const isSelected =
                selectedDate && dayTime === selectedDate.getTime();

              const key = `${day.getFullYear()}-${(day.getMonth() + 1).toString().padStart(2, "0")}-${day.getDate().toString().padStart(2, "0")}`;
              const dayViewings = viewingsByDate[key] || [];
              const hasViewings = dayViewings.length > 0;
              const hasPending = dayViewings.some(
                (v) => v.status === "REQUESTED"
              );

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`relative flex h-11 flex-col items-center justify-center rounded-lg text-sm transition ${
                    isSelected
                      ? "bg-[var(--accent)] text-white shadow-md"
                      : isToday
                      ? "border border-[var(--accent)]/40 text-[var(--accent)]"
                      : "hover:bg-white/10 text-[var(--text-primary)]"
                  }`}
                >
                  {day.getDate()}
                  {hasViewings && (
                    <span
                      className={`absolute bottom-1 h-1 w-1 rounded-full ${
                        hasPending ? "bg-yellow-400" : "bg-green-400"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Detail Panel */}
        <div className="glass-surface p-4">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={16} className="text-[var(--accent)]" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {selectedDate
                ? selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : "Select a date"}
            </h3>
          </div>

          {selectedDayViewings.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[var(--glass-fill)]">
                <CalendarDays
                  size={20}
                  className="text-[var(--text-tertiary)]"
                />
              </div>
              <p className="text-sm text-[var(--text-tertiary)]">
                No viewings scheduled
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayViewings.map((v) => {
                const time = v.scheduledAt
                  ? new Date(v.scheduledAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "TBD";

                const StatusIcon = STATUS_ICONS[v.status] || CircleDot;

                return (
                  <div
                    key={v.id}
                    className={`rounded-xl border p-3 ${STATUS_COLORS[v.status] || "border-[var(--glass-border)]"}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={12} />
                        <span className="text-xs font-bold">{time}</span>
                      </div>
                      <span className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase">
                        {v.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <User size={11} />
                        <span className="font-medium">{v.studentName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} />
                        <span>
                          {v.listingTitle} · {v.listingArea}
                        </span>
                      </div>
                    </div>

                    {v.notes && (
                      <p className="mt-2 truncate text-[11px] text-[var(--text-tertiary)] italic">
                        &quot;{v.notes}&quot;
                      </p>
                    )}

                    {/* Action buttons for pending viewings */}
                    {v.status === "REQUESTED" && (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() =>
                            updateViewingStatus(v.id, "ACCEPTED")
                          }
                          disabled={updatingId === v.id}
                          className="flex-1 rounded-lg bg-[#FBC618]/100/20 px-3 py-1.5 text-[11px] font-bold text-[#ED8023] hover:bg-[#FBC618]/100/30 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            updateViewingStatus(v.id, "DECLINED")
                          }
                          disabled={updatingId === v.id}
                          className="flex-1 rounded-lg bg-red-500/20 px-3 py-1.5 text-[11px] font-bold text-red-400 hover:bg-red-500/30 transition"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {v.status === "ACCEPTED" && (
                      <button
                        onClick={() =>
                          updateViewingStatus(v.id, "COMPLETED")
                        }
                        disabled={updatingId === v.id}
                        className="mt-2 w-full rounded-lg bg-[#FBC618]/100/20 px-3 py-1.5 text-[11px] font-bold text-[#ED8023] hover:bg-[#FBC618]/100/30 transition"
                      >
                        Mark Completed
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

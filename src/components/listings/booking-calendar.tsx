"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  Check,
  X,
} from "lucide-react";

type TimeSlot = {
  time: string;
  available: boolean;
  requestedBy?: string;
};

type BookingCalendarProps = {
  listingId: string;
  agentName?: string;
};

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

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

export function BookingCalendar({
  listingId,
  agentName,
}: BookingCalendarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [notes, setNotes] = useState("");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days: (Date | null)[] = [];

    // Pad start
    for (let i = 0; i < startPad; i++) days.push(null);

    // All days in month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  }, [currentMonth]);

  // Fetch available slots when date is selected
  useEffect(() => {
    if (!selectedDate || !open) return;

    setLoading(true);
    setError("");

    const dateStr = selectedDate.toISOString().split("T")[0];
    fetch(`/api/listings/${listingId}/slots?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.slots) {
          setSlots(data.slots);
        } else {
          // Fallback: generate all slots as available
          setSlots(
            HOURS.map((h) => ({ time: h, available: true }))
          );
        }
        setLoading(false);
      })
      .catch(() => {
        // Fallback slots
        setSlots(HOURS.map((h) => ({ time: h, available: true })));
        setLoading(false);
      });
  }, [selectedDate, listingId, open]);

  async function handleSubmit() {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError("");

    const scheduledAt = new Date(
      `${selectedDate.toISOString().split("T")[0]}T${selectedTime}`
    ).toISOString();

    try {
      const response = await fetch(`/api/listings/${listingId}/viewing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt, notes }),
      });

      const result = await response.json().catch(() => null);

      if (response.status === 401) {
        router.push("/auth/sign-in");
        return;
      }

      if (!response.ok) {
        setError(result?.error ?? "Failed to request viewing.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setSelectedDate(null);
        setSelectedTime(null);
        setNotes("");
        router.refresh();
      }, 2000);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  function prevMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  }

  function formatTime(time: string) {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  if (!open) {
    return (
      <button
        className="button button-glass w-full"
        type="button"
        onClick={() => setOpen(true)}
      >
        <CalendarDays size={18} aria-hidden="true" />
        Request a viewing
      </button>
    );
  }

  if (success) {
    return (
      <div className="glass-surface mt-3 p-6 text-center animate-fade-in">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-full bg-[#FBC618]/10">
          <Check size={28} className="text-[#FBC618]" />
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)]">
          Viewing Requested!
        </h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {agentName ? `${agentName} will` : "The agent will"} confirm your
          time shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-surface mt-3 p-4 animate-fade-in">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-[var(--text-primary)]">
          Choose a Viewing Time
        </h3>
        <button
          onClick={() => {
            setOpen(false);
            setSelectedDate(null);
            setSelectedTime(null);
          }}
          className="flex size-8 items-center justify-center rounded-full hover:bg-white/10"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Calendar Navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex size-8 items-center justify-center rounded-lg hover:bg-white/10"
        >
          <ChevronLeft size={18} />
        </button>
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">
          {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h4>
        <button
          onClick={nextMonth}
          className="flex size-8 items-center justify-center rounded-lg hover:bg-white/10"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day Headers */}
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

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;

          const dayTime = day.getTime();
          const isPast = dayTime < today.getTime();
          const isToday = dayTime === today.getTime();
          const isSelected =
            selectedDate && dayTime === selectedDate.getTime();
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                if (!isPast && !isWeekend) {
                  setSelectedDate(day);
                  setSelectedTime(null);
                }
              }}
              disabled={isPast || isWeekend}
              className={`relative flex h-9 items-center justify-center rounded-lg text-sm font-medium transition ${
                isPast || isWeekend
                  ? "cursor-not-allowed text-[var(--text-tertiary)]/30"
                  : isSelected
                  ? "bg-[var(--accent)] text-white shadow-md"
                  : isToday
                  ? "border border-[var(--accent)]/40 text-[var(--accent)]"
                  : "hover:bg-white/10 text-[var(--text-primary)]"
              }`}
            >
              {day.getDate()}
              {isToday && !isSelected && (
                <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Time Slots */}
      {selectedDate && (
        <div className="mt-4 animate-slide-up">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
            <Clock size={14} className="text-[var(--accent)]" />
            Available times for{" "}
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {slots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => {
                    if (slot.available) setSelectedTime(slot.time);
                  }}
                  disabled={!slot.available}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition ${
                    !slot.available
                      ? "cursor-not-allowed border-[var(--glass-border)]/30 text-[var(--text-tertiary)]/40 line-through"
                      : selectedTime === slot.time
                      ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)] shadow-sm"
                      : "border-[var(--glass-border)] hover:border-[var(--accent)]/40 text-[var(--text-primary)]"
                  }`}
                >
                  {formatTime(slot.time)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes + Submit */}
      {selectedDate && selectedTime && (
        <div className="mt-4 space-y-3 animate-slide-up">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            placeholder="Add a note for the agent (optional)..."
            className="w-full resize-none rounded-xl border border-[var(--glass-border)] bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]"
            rows={2}
          />

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="button button-primary w-full"
          >
            {submitting ? (
              "Requesting..."
            ) : (
              <>
                Request viewing on{" "}
                {selectedDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                at {formatTime(selectedTime)}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AppointmentCalendar({
  selectedDate,
  onSelect,
  blockedDates,
}: {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  blockedDates: Set<string>;
}) {
  const today = startOfDay(new Date());
  const [viewMonth, setViewMonth] = useState(startOfMonth(selectedDate ?? today));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth));
    const end = endOfWeek(endOfMonth(viewMonth));
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const isCurrentMonth = isSameMonth(viewMonth, today);

  return (
    <div className="w-full select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          disabled={isCurrentMonth}
          aria-label="Previous month"
          className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-base font-semibold text-neutral-900">{format(viewMonth, "MMMM yyyy")}</p>
        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
          className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const key = format(day, "yyyy-MM-dd");
          const isPast = isBefore(day, today);
          const isBlocked = blockedDates.has(key);
          const disabled = isPast || isBlocked || !inMonth;
          const selected = selectedDate ? isSameDay(day, selectedDate) : false;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day)}
              aria-label={format(day, "d MMMM yyyy")}
              aria-pressed={selected}
              className={cn(
                "relative flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors sm:h-12",
                !inMonth && "invisible",
                inMonth && !disabled && !selected && "text-neutral-800 hover:bg-orange-50",
                selected && "bg-orange-600 text-white shadow-sm",
                disabled && inMonth && "cursor-not-allowed text-neutral-300 line-through",
                isToday(day) && !selected && "ring-1 ring-inset ring-orange-300"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-orange-600" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" /> Unavailable
        </span>
      </div>
    </div>
  );
}

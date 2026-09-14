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
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const EASE = [0.22, 1, 0.36, 1] as const;

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
  const [monthDirection, setMonthDirection] = useState(1);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth));
    const end = endOfWeek(endOfMonth(viewMonth));
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const isCurrentMonth = isSameMonth(viewMonth, today);

  function changeMonth(delta: number) {
    setMonthDirection(delta);
    setViewMonth((m) => (delta > 0 ? addMonths(m, 1) : subMonths(m, 1)));
  }

  return (
    <div className="w-full select-none">
      <div className="mb-3 flex items-center justify-between">
        <motion.button
          type="button"
          onClick={() => changeMonth(-1)}
          disabled={isCurrentMonth}
          aria-label="Previous month"
          whileTap={isCurrentMonth ? undefined : { scale: 0.9 }}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-brand-500/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <AnimatePresence mode="wait" custom={monthDirection} initial={false}>
          <motion.p
            key={format(viewMonth, "yyyy-MM")}
            custom={monthDirection}
            initial={{ opacity: 0, x: monthDirection > 0 ? 16 : -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: monthDirection > 0 ? -16 : 16 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="text-base font-semibold text-foreground"
          >
            {format(viewMonth, "MMMM yyyy")}
          </motion.p>
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
          whileTap={{ scale: 0.9 }}
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-brand-500/10"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
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
            <motion.button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(day)}
              aria-label={format(day, "d MMMM yyyy")}
              aria-pressed={selected}
              whileTap={disabled ? undefined : { scale: 0.9 }}
              className={cn(
                "relative flex h-11 w-full items-center justify-center rounded-lg text-sm font-medium transition-colors sm:h-12",
                !inMonth && "invisible",
                inMonth && !disabled && "cursor-pointer",
                inMonth && !disabled && !selected && "text-foreground hover:bg-brand-500/10",
                disabled && inMonth && "cursor-not-allowed text-border line-through",
                isToday(day) && !selected && "ring-1 ring-inset ring-brand-400"
              )}
            >
              {selected && (
                <motion.span
                  layoutId="selected-day"
                  className="absolute inset-0 rounded-lg bg-brand-500 shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              )}
              <span className={cn("relative z-10", selected && "text-white")}>{format(day, "d")}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border" /> Unavailable
        </span>
      </div>
    </div>
  );
}

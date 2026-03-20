"use client";

import React, { useState } from "react";
import {
  format,
  parse,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerCalendarProps {
  value?: string;
  onChange: (dateString: string) => void;
  label?: string;
  id?: string;
  name?: string;
  className?: string;
}

export default function DatePickerCalendar({
  value,
  onChange,
  label,
  id,
  name,
  className = "",
}: DatePickerCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    value ? parse(value, "yyyy-MM-dd", new Date()) : new Date()
  );

  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the starting day of week (0 = Sunday)
  const startingDayOfWeek = monthStart.getDay();

  // Create array with empty slots for days before month starts
  const calendarDays = [
    ...Array(startingDayOfWeek).fill(null),
    ...daysInMonth,
  ];

  const handleDateSelect = (day: Date) => {
    const dateString = format(day, "yyyy-MM-dd");
    onChange(dateString);
    setIsOpen(false);
  };

  const displayValue = selectedDate ? format(selectedDate, "dd MMMM yyyy") : "";

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
        >
          {label}
        </label>
      )}

      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 rounded-xl border border-violet-200/80 dark:border-violet-400/30 bg-white/80 dark:bg-violet-950/30 text-slate-900 dark:text-slate-100 text-left shadow-[0_8px_22px_-16px_rgba(124,131,231,0.8)] focus:outline-none focus:ring-2 focus:ring-violet-300/80 dark:focus:ring-violet-400/60 transition-colors"
      >
        {displayValue || "Select a date"}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-violet-50/95 dark:bg-violet-950/65 border border-violet-200/80 dark:border-violet-400/30 rounded-2xl shadow-[0_24px_40px_-28px_rgba(115,102,224,0.8)] z-50 p-4 min-w-80 backdrop-blur-sm">
          {/* Header with month/year and navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-violet-100/90 dark:hover:bg-violet-900/45 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-violet-600 dark:text-violet-300" />
            </button>

            <div className="flex-1 text-center">
              <h3 className="font-semibold text-violet-800 dark:text-violet-100">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-violet-100/90 dark:hover:bg-violet-900/45 rounded-xl transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-violet-600 dark:text-violet-300" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-violet-500 dark:text-violet-300/90 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => day && handleDateSelect(day)}
                disabled={!day}
                className={`
                  h-9 rounded-lg text-sm font-medium transition-all
                  ${
                    !day
                      ? "text-violet-300 dark:text-violet-700/70 cursor-default"
                      : "hover:bg-violet-100/90 dark:hover:bg-violet-900/40 text-violet-700 dark:text-violet-200"
                  }
                  ${
                    selectedDate && day && isSameDay(selectedDate, day)
                      ? "bg-violet-400 text-white font-bold shadow-[0_10px_20px_-14px_rgba(111,92,219,0.95)]"
                      : ""
                  }
                  ${
                    day && !isSameMonth(day, currentMonth)
                      ? "text-violet-300 dark:text-violet-700/60"
                      : ""
                  }
                `}
              >
                {day ? format(day, "d") : ""}
              </button>
            ))}
          </div>

          {/* Footer with today button */}
          <div className="mt-4 pt-4 border-t border-violet-200/80 dark:border-violet-400/25">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                handleDateSelect(today);
              }}
              className="w-full px-3 py-2 bg-violet-400 hover:bg-violet-500 text-white rounded-xl font-semibold transition-all"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

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
        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
      >
        {displayValue || "Select a date"}
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg z-50 p-4 min-w-80">
          {/* Header with month/year and navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>

            <div className="flex-1 text-center">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {format(currentMonth, "MMMM yyyy")}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-slate-600 dark:text-slate-400 py-2"
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
                      ? "text-slate-400 dark:text-slate-600 cursor-default"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }
                  ${
                    selectedDate && day && isSameDay(selectedDate, day)
                      ? "bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-500 text-white font-bold shadow-md"
                      : ""
                  }
                  ${
                    day && !isSameMonth(day, currentMonth)
                      ? "text-slate-400 dark:text-slate-600"
                      : ""
                  }
                `}
              >
                {day ? format(day, "d") : ""}
              </button>
            ))}
          </div>

          {/* Footer with today button */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                handleDateSelect(today);
              }}
              className="w-full px-3 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white rounded-lg font-medium transition-all"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

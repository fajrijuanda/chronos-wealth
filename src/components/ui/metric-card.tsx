import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type MetricTone = "default" | "income" | "expense" | "goal" | "collab" | "projection";
type MetricSize = "md" | "sm";

type MetricCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  tone?: MetricTone;
  size?: MetricSize;
  className?: string;
};

const toneIconClass: Record<MetricTone, string> = {
  default: "bg-indigo-100/80 text-indigo-600 dark:bg-indigo-900/35 dark:text-indigo-300",
  income: "bg-emerald-100/80 text-emerald-600 dark:bg-emerald-900/35 dark:text-emerald-300",
  expense: "bg-rose-100/80 text-rose-600 dark:bg-rose-900/35 dark:text-rose-300",
  goal: "bg-amber-100/80 text-amber-600 dark:bg-amber-900/35 dark:text-amber-300",
  collab: "bg-violet-100/80 text-violet-600 dark:bg-violet-900/35 dark:text-violet-300",
  projection: "bg-sky-100/80 text-sky-600 dark:bg-sky-900/35 dark:text-sky-300",
};

const toneCardClass: Record<MetricTone, string> = {
  default: "bg-linear-to-br from-indigo-50/80 to-indigo-100/55 border-indigo-200/65 dark:from-indigo-950/35 dark:to-indigo-900/20 dark:border-indigo-800/40",
  income: "bg-linear-to-br from-emerald-50/82 to-teal-100/55 border-emerald-200/65 dark:from-emerald-950/32 dark:to-teal-900/20 dark:border-emerald-800/40",
  expense: "bg-linear-to-br from-rose-50/82 to-pink-100/55 border-rose-200/65 dark:from-rose-950/32 dark:to-pink-900/20 dark:border-rose-800/40",
  goal: "bg-linear-to-br from-amber-50/82 to-orange-100/55 border-amber-200/65 dark:from-amber-950/32 dark:to-orange-900/20 dark:border-amber-800/40",
  collab: "bg-linear-to-br from-violet-50/82 to-fuchsia-100/55 border-violet-200/65 dark:from-violet-950/32 dark:to-fuchsia-900/20 dark:border-violet-800/40",
  projection: "bg-linear-to-br from-sky-50/82 to-cyan-100/55 border-sky-200/65 dark:from-sky-950/32 dark:to-cyan-900/20 dark:border-sky-800/40",
};

const toneValueClass: Record<MetricTone, string> = {
  default: "text-title",
  income: "text-income",
  expense: "text-expense",
  goal: "text-goal",
  collab: "text-collab",
  projection: "text-projection",
};

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "default",
  size = "md",
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-3xl overflow-hidden backdrop-blur-xl border shadow-[0_22px_40px_-28px_rgba(94,101,182,0.95)] ring-1 ring-white/65 dark:ring-white/10",
        toneCardClass[tone],
        size === "md" ? "p-4 sm:p-5 lg:p-6" : "px-3 py-3 sm:px-4",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-white/45 blur-2xl dark:bg-white/10" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-indigo-200/30 blur-2xl dark:bg-indigo-500/12" />
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-white/80 dark:bg-white/25" />

      {Icon ? (
        <div className={cn("relative mb-3 inline-flex rounded-2xl p-2.5 shadow-[0_12px_24px_-18px_rgba(98,105,186,0.95)]", toneIconClass[tone])}>
          <Icon className={size === "md" ? "h-5 w-5 sm:h-6 sm:w-6" : "h-4 w-4"} />
        </div>
      ) : null}

      <p className={cn("font-semibold", size === "md" ? "text-[13px] sm:text-sm" : "text-[10px] uppercase tracking-[0.09em] text-muted-foreground")}>
        {title}
      </p>

      <p
        className={cn(
          "mt-1 truncate font-bold tracking-tight",
          size === "md" ? "text-xl sm:text-2xl lg:text-3xl" : "text-base sm:text-xl",
          toneValueClass[tone],
        )}
      >
        {value}
      </p>

      {subtitle ? (
        <p className={cn("mt-1 truncate text-body-muted", size === "md" ? "text-[10px] sm:text-xs" : "text-[10px] sm:text-xs")}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

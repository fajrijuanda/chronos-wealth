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
        "rounded-3xl overflow-hidden backdrop-blur-xl bg-card/75 border border-border/85 shadow-[0_18px_34px_-26px_rgba(94,101,182,0.95)] ring-1 ring-white/65 dark:ring-white/10",
        size === "md" ? "p-6" : "px-4 py-3",
        className,
      )}
    >
      {Icon ? (
        <div className={cn("mb-4 inline-flex rounded-xl p-3", toneIconClass[tone])}>
          <Icon className={size === "md" ? "h-6 w-6" : "h-4 w-4"} />
        </div>
      ) : null}

      <p className={cn("font-semibold", size === "md" ? "text-base" : "text-xs uppercase tracking-widest text-muted-foreground")}>
        {title}
      </p>

      <p
        className={cn(
          "mt-1 truncate font-bold tracking-tight",
          size === "md" ? "text-3xl xl:text-4xl" : "text-2xl",
          toneValueClass[tone],
        )}
      >
        {value}
      </p>

      {subtitle ? (
        <p className={cn("mt-1 truncate", size === "md" ? "text-xs text-body-muted" : "text-xs text-body-muted")}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

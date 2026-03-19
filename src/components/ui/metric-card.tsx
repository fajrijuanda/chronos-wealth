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
  default: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
  income: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
  expense: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300",
  goal: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
  collab: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300",
  projection: "bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-300",
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
        "rounded-2xl backdrop-blur-md bg-card/70 border border-border shadow-sm",
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

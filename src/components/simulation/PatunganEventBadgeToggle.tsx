"use client";

import { useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatGroupedNumber } from "@/lib/number-format";

type PatunganEventBadgeToggleProps = {
  monthKey: string;
  eventLabel: string;
  eventAmount: number;
  eventDay: number;
  className: string;
  isDisabled: boolean;
};

export function PatunganEventBadgeToggle(props: PatunganEventBadgeToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const title = useMemo(() => {
    const suffix = props.eventAmount > 0 ? ` (Rp ${formatGroupedNumber(props.eventAmount)})` : "";
    const stateLabel = props.isDisabled
      ? "Klik untuk aktifkan lagi patungan suggestion bulan ini"
      : "Klik untuk nonaktifkan patungan suggestion bulan ini";
    return `${props.eventLabel}${suffix} H${props.eventDay} • ${stateLabel}`;
  }, [props.eventAmount, props.eventDay, props.eventLabel, props.isDisabled]);

  const toggleMonth = () => {
    const params = new URLSearchParams(searchParams.toString());
    const raw = params.get("disabledPatunganMonths") ?? "";
    const current = raw
      .split(",")
      .map((value) => value.trim())
      .filter((value) => /^\d{4}-\d{2}$/.test(value));
    const set = new Set(current);

    if (set.has(props.monthKey)) {
      set.delete(props.monthKey);
    } else {
      set.add(props.monthKey);
    }

    const next = Array.from(set).sort();

    if (next.length > 0) {
      params.set("disabledPatunganMonths", next.join(","));
    } else {
      params.delete("disabledPatunganMonths");
    }

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  return (
    <button
      type="button"
      onClick={toggleMonth}
      title={title}
      disabled={isPending}
      className={`${props.className} cursor-pointer transition-opacity hover:opacity-85 disabled:cursor-wait disabled:opacity-60 ${props.isDisabled ? "ring-1 ring-rose-300 line-through" : ""}`}
    >
      {props.eventLabel} {props.eventAmount > 0 ? `(Rp ${formatGroupedNumber(props.eventAmount)})` : ""} H{props.eventDay}
      {props.isDisabled ? " (OFF)" : ""}
    </button>
  );
}

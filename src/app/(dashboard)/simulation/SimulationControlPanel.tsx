"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SimulationSettingsDialog } from "./SimulationSettingsDialog";
import { ManualPriceForm } from "../assets/ManualPriceForm";

type EventFilter =
  | "all"
  | "renewal"
  | "capital_return"
  | "takeover"
  | "ended"
  | "pt2_contribution";

type CsvDelimiter = "comma" | "semicolon";

type FriendOption = {
  id: string;
  email: string;
  displayName: string;
};

type FinanceProfile = {
  monthlyExpenseMin: number;
  monthlyExpenseMax: number;
  purchaseTiming: "START_OF_MONTH" | "END_OF_MONTH";
  purchaseDayOverride?: number | null;
  openingBalance?: number;
  idleCashTarget?: number;
  holdingCapitalTarget?: number;
  holdingContributionPct?: number;
  holdingLaunchDate?: Date;
  pt2BuildCapitalTarget?: number;
  pt2ContributionPct?: number;
  pt2LaunchDate?: Date;
  renewEconomyBoothContracts?: boolean;
  renewExclusiveBoothContracts?: boolean;
};

export function SimulationControlPanel(props: {
  activeEmail: string;
  basePrice: number;
  initialTargetDate: string;
  initialPartnerEmail: string;
  initialDelimiter: CsvDelimiter;
  initialIncludePt2Csv: boolean;
  initialEventFilter: EventFilter;
  initialIncludeHoldingPlan: boolean;
  initialIncludePt2Plan: boolean;
  acceptedFriends: FriendOption[];
  financeProfile: FinanceProfile | null | undefined;
}) {
  const router = useRouter();

  const [date, setDate] = useState(props.initialTargetDate);
  const [partnerEmail, setPartnerEmail] = useState(props.initialPartnerEmail);
  const [delimiter, setDelimiter] = useState<CsvDelimiter>(props.initialDelimiter);
  const [includePt2Csv, setIncludePt2Csv] = useState(props.initialIncludePt2Csv ? "yes" : "no");
  const [eventFilter, setEventFilter] = useState<EventFilter>(props.initialEventFilter);
  const [includeHolding, setIncludeHolding] = useState(props.initialIncludeHoldingPlan);
  const [includePt2, setIncludePt2] = useState(props.initialIncludePt2Plan);

  const applySimulation = () => {
    const params = new URLSearchParams();

    params.set("date", date);
    params.set("delimiter", delimiter);
    params.set("includePt2Csv", includePt2Csv);
    params.set("eventFilter", eventFilter);

    if (partnerEmail) {
      params.set("partner", partnerEmail);
    }

    if (includeHolding) {
      params.set("includeHolding", "yes");
    }

    if (includePt2) {
      params.set("includePt2", "yes");
    }

    router.push(`/simulation?${params.toString()}`);
  };

  return (
    <div className="surface-card p-6 h-fit space-y-5 lg:sticky lg:top-20">
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="font-bold text-lg">Simulation Controls</h2>
      </div>

      <div className="surface-card-soft p-4 space-y-3">
        <h3 className="font-semibold text-sm">Acuan Harga Dasar Booth</h3>
        <p className="text-xs text-body-muted">Dipakai sebagai basis perhitungan pembelian booth.</p>
        <ManualPriceForm email={props.activeEmail} currentPrice={props.basePrice} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label htmlFor="sim-target-date" className="text-xs font-black uppercase tracking-widest text-slate-400">
            Target Date
          </label>
          <input
            id="sim-target-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-11 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-black/20 px-4"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Partner (Optional)</label>
          <Select value={partnerEmail} onValueChange={setPartnerEmail}>
            <SelectTrigger className="h-11 w-full rounded-2xl bg-white/70 dark:bg-black/20">
              <SelectValue placeholder="Tanpa partner (simulasi pribadi)" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="" className="rounded-xl">Tanpa partner (simulasi pribadi)</SelectItem>
              {props.acceptedFriends.map((friend) => (
                <SelectItem key={friend.id} value={friend.email} className="rounded-xl">
                  {friend.displayName} ({friend.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {props.acceptedFriends.length === 0 ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Belum ada teman accepted. Tambahkan koneksi di Profile tab Connect.
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Format CSV</label>
          <Select value={delimiter} onValueChange={(value) => setDelimiter(value as CsvDelimiter)}>
            <SelectTrigger className="h-11 w-full rounded-2xl bg-white/70 dark:bg-black/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="comma" className="rounded-xl">Comma (,)</SelectItem>
              <SelectItem value="semicolon" className="rounded-xl">Semicolon (;)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Include PT2 in CSV</label>
          <Select value={includePt2Csv} onValueChange={setIncludePt2Csv}>
            <SelectTrigger className="h-11 w-full rounded-2xl bg-white/70 dark:bg-black/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="yes" className="rounded-xl">Yes</SelectItem>
              <SelectItem value="no" className="rounded-xl">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Timeline Filter</label>
        <Select value={eventFilter} onValueChange={(value) => setEventFilter(value as EventFilter)}>
          <SelectTrigger className="h-11 w-full rounded-2xl bg-white/70 dark:bg-black/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="all" className="rounded-xl">All Lifecycle Events</SelectItem>
            <SelectItem value="renewal" className="rounded-xl">Renewal (Kontrak)</SelectItem>
            <SelectItem value="capital_return" className="rounded-xl">Capital Return</SelectItem>
            <SelectItem value="takeover" className="rounded-xl">Takeover</SelectItem>
            <SelectItem value="ended" className="rounded-xl">Ended</SelectItem>
            <SelectItem value="pt2_contribution" className="rounded-xl">PT2 Urunan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card-soft px-4 py-3 space-y-2">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Target Plans</p>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeHolding}
            onChange={(event) => setIncludeHolding(event.target.checked)}
          />
          Include Holding Capital Plan
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includePt2}
            onChange={(event) => setIncludePt2(event.target.checked)}
          />
          Include PT 2 Urunan Plan
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={applySimulation}
          className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 h-11 text-sm font-bold"
        >
          Recalculate Growth
        </Button>
        <SimulationSettingsDialog email={props.activeEmail} profile={props.financeProfile} />
      </div>
    </div>
  );
}

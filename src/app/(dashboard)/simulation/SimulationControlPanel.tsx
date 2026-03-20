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
import DatePickerCalendar from "@/components/ui/DatePickerCalendar";
import { SimulationSettingsDialog } from "./SimulationSettingsDialog";
import { ManualPriceForm } from "../assets/ManualPriceForm";

type EventFilter =
  | "all"
  | "renewal"
  | "capital_return"
  | "takeover"
  | "ended"
  | "partner_suggestion";

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
  renewEconomyBoothContracts?: boolean;
  renewExclusiveBoothContracts?: boolean;
};

const NO_PARTNER_VALUE = "__no_partner__";

export function SimulationControlPanel(props: {
  activeEmail: string;
  basePrice: number;
  initialTargetDate: string;
  initialStartDate: string;
  initialPartnerEmail: string;
  initialDelimiter: CsvDelimiter;
  initialEventFilter: EventFilter;
  acceptedFriends: FriendOption[];
  financeProfile: FinanceProfile | null | undefined;
  initialExtraBoothCommission: boolean;
  initialExtraCashierPartners: boolean;
  initialExtraFreelance: boolean;
}) {
  const router = useRouter();

  const [startDate, setStartDate] = useState(props.initialStartDate);
  const [date, setDate] = useState(props.initialTargetDate);
  const [partnerEmail, setPartnerEmail] = useState(
    props.initialPartnerEmail || NO_PARTNER_VALUE,
  );
  const [delimiter, setDelimiter] = useState<CsvDelimiter>(props.initialDelimiter);
  const [eventFilter, setEventFilter] = useState<EventFilter>(props.initialEventFilter);
  const [includeExtraBoothCommission, setIncludeExtraBoothCommission] = useState(
    props.initialExtraBoothCommission,
  );
  const [includeExtraCashierPartners, setIncludeExtraCashierPartners] = useState(
    props.initialExtraCashierPartners,
  );
  const [includeExtraFreelance, setIncludeExtraFreelance] = useState(
    props.initialExtraFreelance,
  );
  const [openingBalance, setOpeningBalance] = useState(
    props.financeProfile?.openingBalance?.toString() || "0",
  );

  const applySimulation = () => {
    const params = new URLSearchParams();

    params.set("startDate", startDate);
    params.set("date", date);
    params.set("delimiter", delimiter);
    params.set("eventFilter", eventFilter);
    
    const balanceNum = parseFloat(openingBalance) || 0;
    if (balanceNum > 0) {
      params.set("openingBalance", balanceNum.toString());
    }

    if (partnerEmail !== NO_PARTNER_VALUE) {
      params.set("partner", partnerEmail);
    }

    if (includeExtraBoothCommission) {
      params.set("extraBoothCommission", "1");
    }

    if (includeExtraCashierPartners) {
      params.set("extraCashierPartners", "1");
    }

    if (includeExtraFreelance) {
      params.set("extraFreelance", "1");
    }

    router.push(`/simulation?${params.toString()}`);
  };

  return (
    <div className="surface-card relative z-40 p-6 h-fit space-y-5 lg:sticky lg:top-20">
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
          <label htmlFor="sim-start-date" className="text-xs font-black uppercase tracking-widest text-slate-400">
            Start Month
          </label>
          <DatePickerCalendar
            id="sim-start-date"
            value={startDate}
            onChange={setStartDate}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="sim-target-date" className="text-xs font-black uppercase tracking-widest text-slate-400">
            Target Date
          </label>
          <DatePickerCalendar
            id="sim-target-date"
            value={date}
            onChange={setDate}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label htmlFor="sim-opening-balance" className="text-xs font-black uppercase tracking-widest text-slate-400">
            Opening Balance
          </label>
          <input
            id="sim-opening-balance"
            type="number"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            placeholder="0"
            className="w-full h-11 px-4 rounded-2xl bg-white/70 dark:bg-black/20 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-[11px] text-slate-500">Saldo akhir bulan sebelum simulasi dimulai</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label htmlFor="sim-partner-email" className="text-xs font-black uppercase tracking-widest text-slate-400">
            Partner
          </label>
          <Select value={partnerEmail} onValueChange={setPartnerEmail}>
            <SelectTrigger className="h-11 w-full rounded-2xl bg-white/70 dark:bg-black/20">
              <SelectValue placeholder="Tanpa partner (simulasi pribadi)" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value={NO_PARTNER_VALUE} className="rounded-xl">Tanpa partner (simulasi pribadi)</SelectItem>
              {props.acceptedFriends.map((friend) => (
                <SelectItem key={friend.id} value={friend.email} className="rounded-xl">
                  {friend.displayName} ({friend.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {props.acceptedFriends.length === 0 ? (
            <p className="text-[11px] text-amber-600 dark:text-amber-400">
              Belum ada teman accepted. Tambahkan koneksi di Profile tab Connect.
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
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
            <SelectItem value="partner_suggestion" className="rounded-xl">Patungan Suggestion</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="surface-card-soft p-4 space-y-3">
        <h3 className="font-semibold text-sm">Scenario Filter</h3>
        <p className="text-xs text-body-muted">Aktifkan asumsi tambahan untuk melihat dampaknya ke pertumbuhan booth.</p>

        <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={includeExtraBoothCommission}
            onChange={(event) => setIncludeExtraBoothCommission(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Tambahan commission 2 booth per bulan (Rp 500.000)</span>
        </label>

        <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={includeExtraCashierPartners}
            onChange={(event) => setIncludeExtraCashierPartners(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Tambahan 2 mitra kasir (masing-masing Rp 2.000.000 per bulan)</span>
        </label>

        <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={includeExtraFreelance}
            onChange={(event) => setIncludeExtraFreelance(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Tambahan freelance Rp 2.000.000 per bulan</span>
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

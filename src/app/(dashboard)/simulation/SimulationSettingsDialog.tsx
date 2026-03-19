"use client";

import { useState, useTransition } from "react";
import { Settings2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStatus } from "@/components/providers/StatusProvider";
import { setUserFinanceProfileByEmail } from "@/actions/collaboration";
import { useRouter } from "next/navigation";
import { BoothPurchaseTiming } from "@prisma/client";

interface FinanceProfile {
    monthlyExpenseMin: number;
    monthlyExpenseMax: number;
    purchaseTiming: BoothPurchaseTiming;
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
}

export function SimulationSettingsDialog({ 
    email, 
    profile 
}: { 
    email: string, 
    profile?: FinanceProfile | null 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { showLoading, showSuccess, showError } = useStatus();
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const data = {
        email,
        monthlyExpenseMin: Number(formData.get("monthlyExpenseMin") ?? 0),
        monthlyExpenseMax: Number(formData.get("monthlyExpenseMax") ?? 0),
        purchaseTiming: formData.get("purchaseTiming") as BoothPurchaseTiming,
        purchaseDayOverride: formData.get("purchaseDayOverride") ? Number(formData.get("purchaseDayOverride")) : null,
        openingBalance: Number(formData.get("openingBalance") ?? 0),
        idleCashTarget: Number(formData.get("idleCashTarget") ?? 1000000000),
        holdingCapitalTarget: Number(formData.get("holdingCapitalTarget") ?? 1500000000),
        holdingContributionPct: Number(formData.get("holdingContributionPct") ?? 50),
        holdingLaunchDate: formData.get("holdingLaunchDate") ? new Date(formData.get("holdingLaunchDate") as string) : undefined,
        pt2BuildCapitalTarget: Number(formData.get("pt2BuildCapitalTarget") ?? 8000000000),
        pt2ContributionPct: Number(formData.get("pt2ContributionPct") ?? 50),
        pt2LaunchDate: formData.get("pt2LaunchDate") ? new Date(formData.get("pt2LaunchDate") as string) : undefined,
        renewEconomyBoothContracts: formData.get("renewEconomyBoothContracts") === "on",
        renewExclusiveBoothContracts: formData.get("renewExclusiveBoothContracts") === "on",
    };

    startTransition(async () => {
        showLoading("Menyimpan pengaturan finansial...");
        try {
            await setUserFinanceProfileByEmail(data);
            showSuccess("Profil finansial berhasil diperbarui.");
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal memperbarui profil.";
            showError(message);
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full rounded-xl gap-2 h-11 border-slate-200 dark:border-slate-800">
            <Settings2 className="w-4 h-4" />
            Edit Finance Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finance Profile Settings</DialogTitle>
          <DialogDescription>
            Pengaturan ini akan digunakan sebagai parameter dasar dalam simulasi pertumbuhan booth Anda.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="sim-min-monthly-expense" className="text-sm font-medium">Min Monthly Expense (Rp)</label>
                <input
                id="sim-min-monthly-expense"
                    name="monthlyExpenseMin"
                    type="number"
                    required
                    defaultValue={profile?.monthlyExpenseMin ?? 0}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                />
            </div>
            <div className="space-y-2">
              <label htmlFor="sim-max-monthly-expense" className="text-sm font-medium">Max Monthly Expense (Rp)</label>
                <input
                id="sim-max-monthly-expense"
                    name="monthlyExpenseMax"
                    type="number"
                    required
                    defaultValue={profile?.monthlyExpenseMax ?? 0}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="sim-purchase-timing" className="text-sm font-medium">Purchase Timing</label>
                <select
                id="sim-purchase-timing"
                    name="purchaseTiming"
                    defaultValue={profile?.purchaseTiming ?? "END_OF_MONTH"}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                >
                    <option value="START_OF_MONTH">Awal Bulan</option>
                    <option value="END_OF_MONTH">Akhir Bulan</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Purchase Day Override (1-31)</label>
                <input
                    name="purchaseDayOverride"
                    type="number"
                    min={1}
                    max={31}
                    defaultValue={profile?.purchaseDayOverride ?? ""}
                    placeholder="Kosongkan jika default"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                />
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Strategic Targets</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="sim-idle-cash-target" className="text-sm font-medium">Idle Cash Target (Rp)</label>
                    <input
                    id="sim-idle-cash-target"
                        name="idleCashTarget"
                        type="number"
                        defaultValue={profile?.idleCashTarget ?? 1000000000}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                </div>
                <div className="space-y-2">
                  <label htmlFor="sim-opening-balance" className="text-sm font-medium">Opening Balance (Rp)</label>
                    <input
                    id="sim-opening-balance"
                        name="openingBalance"
                        type="number"
                        defaultValue={profile?.openingBalance ?? 0}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                </div>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">Contracts & Renewals</h4>
            <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <input 
                        name="renewEconomyBoothContracts" 
                        type="checkbox" 
                        defaultChecked={profile?.renewEconomyBoothContracts ?? true}
                    className="shrink-0" 
                    />
                    <span className="text-sm font-medium">Renew Economy Booth Contracts otomatis?</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <input 
                        name="renewExclusiveBoothContracts" 
                        type="checkbox" 
                        defaultChecked={profile?.renewExclusiveBoothContracts ?? true}
                    className="shrink-0" 
                    />
                    <span className="text-sm font-medium">Renew Exclusive Booth Contracts otomatis?</span>
                </label>
            </div>
          </div>

          <DialogFooter className="pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Settings
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

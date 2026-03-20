"use client";

import { useState, useTransition } from "react";
import { Edit2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStatus } from "@/components/providers/StatusProvider";
import { updateIncomeSource } from "@/actions/income";
import { CategoryType } from "@prisma/client";
import { useRouter } from "next/navigation";

interface IncomeData {
    id: string;
    name: string;
    amount: number;
    category: CategoryType;
    isRecurring: boolean;
    payoutDate: number | null;
    expectedDate: Date | null;
}

export function EditIncomeDialog({ income }: { income: IncomeData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState<CategoryType>(income.category);
  const [scheduleMode, setScheduleMode] = useState<"RECURRING" | "ONE_TIME">(
    income.isRecurring ? "RECURRING" : "ONE_TIME",
  );
  const { showLoading, showSuccess, showError } = useStatus();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isBoothCategory = categoryValue === "BOOTH";

  function parseDateInputToUtcNoon(dateInput: string): Date | null {
    const trimmed = dateInput.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    if (!match) return null;

    const year = Number(match[1]);
    const monthIndex = Number(match[2]) - 1;
    const day = Number(match[3]);
    if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || !Number.isInteger(day)) {
      return null;
    }

    return new Date(Date.UTC(year, monthIndex, day, 12, 0, 0));
  }

  async function handleSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "");
    const amount = Number(formData.get("amount") ?? 0);
    const category = String(formData.get("category") ?? "SALARY") as CategoryType;
    const isRecurring = formData.get("isRecurring") === "on";
    const payoutDate = Number(formData.get("payoutDate") || 1);
    const expectedDateStr = String(formData.get("expectedDate") ?? "");
    const startDateStr = String(formData.get("startDate") ?? "");
    const parsedStartDate = parseDateInputToUtcNoon(startDateStr);
    const effectiveIsRecurring = isBoothCategory || (scheduleMode === "RECURRING" && isRecurring);
    const effectivePayoutDate = effectiveIsRecurring ? payoutDate : null;
    const effectiveExpectedDate = effectiveIsRecurring
      ? parsedStartDate
      : (expectedDateStr ? parseDateInputToUtcNoon(expectedDateStr) : null);

    startTransition(async () => {
        showLoading("Memperbarui sumber pendapatan...");
        try {
            await updateIncomeSource(income.id, {
                name,
                amount,
                category,
              isRecurring: effectiveIsRecurring,
              payoutDate: effectivePayoutDate,
              expectedDate: effectiveExpectedDate,
            });
            showSuccess("Data pendapatan berhasil diperbarui.");
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal memperbarui pendapatan.";
            showError(message);
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800">
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>Edit Income Source</DialogTitle>
          <DialogDescription>
            Sesuaikan detail sumber pendapatan Anda di sini.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Pendapatan</label>
            <input
              title="Nama pendapatan"
              name="name"
              required
              defaultValue={income.name}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jumlah (Rp)</label>
              <input
                title="Jumlah pendapatan"
                name="amount"
                type="number"
                required
                defaultValue={income.amount}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
              />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Kategori</label>
                <input type="hidden" name="category" value={categoryValue} />
                <Select value={categoryValue} onValueChange={(value) => setCategoryValue(value as CategoryType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALARY">Salary</SelectItem>
                    <SelectItem value="PROJECT">Project / Freelance</SelectItem>
                    <SelectItem value="COMMISSION">Commission</SelectItem>
                    <SelectItem value="BOOTH">Booth Business</SelectItem>
                    <SelectItem value="STOCK">Dividen / Saham</SelectItem>
                    <SelectItem value="SAAS">SaaS Business</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <input type="hidden" name="isRecurring" value={isBoothCategory || scheduleMode === "RECURRING" ? "on" : "off"} />
            {isBoothCategory ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
                Kategori Booth selalu <span className="font-semibold">Recurring Bulanan</span>.
              </div>
            ) : (
              <>
                <label htmlFor="income-edit-schedule-mode" className="text-sm font-medium">Pola Jadwal</label>
                <Select
                  value={scheduleMode}
                  onValueChange={(value) => setScheduleMode(value === "ONE_TIME" ? "ONE_TIME" : "RECURRING")}
                >
                  <SelectTrigger id="income-edit-schedule-mode" className="w-full">
                    <SelectValue placeholder="Pilih pola jadwal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RECURRING">Recurring bulanan</SelectItem>
                    <SelectItem value="ONE_TIME">Sekali cair di tanggal tertentu</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isBoothCategory || scheduleMode === "RECURRING" ? (
              <>
                <div className="space-y-2">
                    <label className="text-sm font-medium italic text-slate-500">Recurring Bulanan:</label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Dibayar setiap tanggal</span>
                        <input
                          title="Tanggal payout recurring"
                            name="payoutDate"
                            type="number"
                            min={1}
                            max={31}
                            defaultValue={income.payoutDate || 25}
                            className="w-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1.5"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label htmlFor="income-edit-start-date" className="text-sm font-medium italic text-slate-500">Mulai gajian dari tanggal:</label>
                    <input
                      id="income-edit-start-date"
                      name="startDate"
                      type="date"
                      defaultValue={income.isRecurring && income.expectedDate ? new Date(income.expectedDate).toISOString().slice(0,10) : ""}
                      required={!isBoothCategory}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                  <label htmlFor="income-edit-expected-date" className="text-sm font-medium italic text-slate-500">Sekali cair pada tanggal:</label>
                  <input
                    id="income-edit-expected-date"
                    title="Tanggal pendapatan one-time"
                      name="expectedDate"
                      type="date"
                      defaultValue={!income.isRecurring && income.expectedDate ? new Date(income.expectedDate).toISOString().slice(0,10) : ""}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                  />
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? "Updating..." : "Update Income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

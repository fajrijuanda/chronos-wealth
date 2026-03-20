"use client";

import { useState, useTransition } from "react";
import { PlusCircle } from "lucide-react";
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
import { createIncomeSourceByEmail } from "@/actions/income";
import { CategoryType } from "@prisma/client";
import { useRouter } from "next/navigation";
import DatePickerCalendar from "@/components/ui/DatePickerCalendar";

const DEFAULT_OPTIONS: Array<{ value: CategoryType; label: string }> = [
  { value: "SALARY", label: "Salary" },
  { value: "PROJECT", label: "Project / Freelance" },
  { value: "COMMISSION", label: "Commission" },
  { value: "STOCK", label: "Dividen / Saham" },
  { value: "SAAS", label: "SaaS Business" },
  { value: "BONUS", label: "Bonus" },
  { value: "BOOTH", label: "Booth Business" },
];

export function AddIncomeDialog({
  email,
  categoryOptions,
}: {
  email: string;
  categoryOptions?: CategoryType[];
}) {
  const options = DEFAULT_OPTIONS.filter((opt) =>
    categoryOptions ? categoryOptions.includes(opt.value) : true,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState<CategoryType>(options[0]?.value ?? "SALARY");
  const [scheduleMode, setScheduleMode] = useState<"RECURRING" | "ONE_TIME">("RECURRING");
  const [startDate, setStartDate] = useState<string>("");
  const [expectedDate, setExpectedDate] = useState<string>("");
  const [contractDurationMonths, setContractDurationMonths] = useState<number | null>(12);
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
    const expectedDateStr = expectedDate;
    const startDateStr = startDate;
    const parsedStartDate = parseDateInputToUtcNoon(startDateStr);
    const contractDuration = formData.get("contractDurationMonths") ? Number(formData.get("contractDurationMonths")) : null;
    const effectiveIsRecurring = isBoothCategory || (scheduleMode === "RECURRING" && isRecurring);
    const effectivePayoutDate = effectiveIsRecurring ? payoutDate : null;
    const effectiveExpectedDate = effectiveIsRecurring
      ? parsedStartDate
      : (expectedDateStr ? parseDateInputToUtcNoon(expectedDateStr) : null);

    startTransition(async () => {
        showLoading("Menambahkan sumber pendapatan...");
        try {
            await createIncomeSourceByEmail({
                ownerEmail: email,
                name,
                amount,
                category,
              isRecurring: effectiveIsRecurring,
              payoutDate: effectiveIsRecurring ? effectivePayoutDate : null,
              expectedDate: effectiveExpectedDate,
              contractDurationMonths: contractDuration,
            });
            showSuccess("Sumber pendapatan baru berhasil ditambahkan.");
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menambahkan pendapatan.";
            showError(message);
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl shadow-md bg-blue-600 hover:bg-blue-700 text-white gap-2 h-auto">
          <PlusCircle className="w-4 h-4" />
          Add Income
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto z-50">
        <DialogHeader>
          <DialogTitle>Add New Income Source</DialogTitle>
          <DialogDescription>
            Catat pendapatan rutin atau proyek sekali jalan untuk simulasi cashflow Anda.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="income-name" className="text-sm font-medium">Nama Pendapatan</label>
            <input
              id="income-name"
              name="name"
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
              placeholder="Gaji Utama, Bonus Project, dll."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="income-amount" className="text-sm font-medium">Jumlah (Rp)</label>
              <input
                id="income-amount"
                name="amount"
                type="number"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                placeholder="5000000"
              />
            </div>
            <div className="space-y-2">
                <label htmlFor="income-category" className="text-sm font-medium">Kategori</label>
                <input type="hidden" name="category" value={categoryValue} />
                <Select value={categoryValue} onValueChange={(value) => setCategoryValue(value as CategoryType)}>
                  <SelectTrigger id="income-category" className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
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
            ) : categoryValue === "COMMISSION" ? (
              <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30 px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
                <span className="font-semibold">Komisi Recurring:</span> Kontrak berlaku selama <span className="font-bold">2 tahun (24 bulan)</span> dari tanggal mulai. Jika ada renewal, kontrak baru dimulai lagi.
              </div>
            ) : (
              <>
                <label htmlFor="income-schedule-mode" className="text-sm font-medium">Pola Jadwal</label>
                <Select
                  value={scheduleMode}
                  onValueChange={(value) => setScheduleMode(value === "ONE_TIME" ? "ONE_TIME" : "RECURRING")}
                >
                  <SelectTrigger id="income-schedule-mode" className="w-full">
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

          {(isBoothCategory || scheduleMode === "RECURRING") && (
            <div className="space-y-2">
              <label htmlFor="income-contract-duration" className="text-sm font-medium">Kontrak Durasi</label>
              <Select 
                value={contractDurationMonths === null ? "forever" : String(contractDurationMonths)} 
                onValueChange={(value) => setContractDurationMonths(value === "forever" ? null : Number(value))}
              >
                <SelectTrigger id="income-contract-duration" className="w-full">
                  <SelectValue placeholder="Pilih durasi kontrak" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">1 Tahun (12 bulan)</SelectItem>
                  <SelectItem value="24">2 Tahun (24 bulan)</SelectItem>
                  <SelectItem value="48">4 Tahun (48 bulan)</SelectItem>
                  <SelectItem value="forever">Selamanya</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="contractDurationMonths" value={contractDurationMonths === null ? "" : String(contractDurationMonths)} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {isBoothCategory || scheduleMode === "RECURRING" ? (
              <>
                <div className="space-y-2">
                    <label className="text-sm font-medium italic text-slate-500">Recurring Bulanan:</label>
                    <div className="flex items-center gap-2">
                      <label htmlFor="income-payout-date" className="text-sm">Dibayar setiap tanggal</label>
                        <input
                        id="income-payout-date"
                            name="payoutDate"
                            type="number"
                            min={1}
                            max={31}
                            defaultValue={25}
                            className="w-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1.5"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium italic text-slate-500">Mulai gajian dari tanggal:</label>
                  <DatePickerCalendar
                    id="income-start-date"
                    value={startDate}
                    onChange={setStartDate}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Contoh: mulai kerja 1 April, gajian pertama 1 Mei. Isi tanggal pertama kali cair.
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium italic text-slate-500">Sekali cair pada tanggal:</label>
                <DatePickerCalendar
                  id="income-expected-date"
                  value={expectedDate}
                  onChange={setExpectedDate}
                />
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? "Saving..." : "Save Income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

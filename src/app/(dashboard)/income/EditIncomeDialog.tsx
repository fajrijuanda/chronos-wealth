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
  const { showLoading, showSuccess, showError } = useStatus();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "");
    const amount = Number(formData.get("amount") ?? 0);
    const category = String(formData.get("category") ?? "SALARY") as CategoryType;
    const isRecurring = formData.get("isRecurring") === "on";
    const payoutDate = Number(formData.get("payoutDate") || 1);
    const expectedDateStr = String(formData.get("expectedDate") ?? "");

    startTransition(async () => {
        showLoading("Memperbarui sumber pendapatan...");
        try {
            await updateIncomeSource(income.id, {
                name,
                amount,
                category,
                isRecurring,
                payoutDate: isRecurring ? payoutDate : null,
                expectedDate: !isRecurring && expectedDateStr ? new Date(expectedDateStr) : null,
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
      <DialogContent className="sm:max-w-[480px]">
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
          
          <div className="flex items-center gap-2 py-2">
            <input 
                type="checkbox" 
                name="isRecurring" 
                id="isRecurringEdit" 
                defaultChecked={income.isRecurring}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor="isRecurringEdit" className="text-sm font-medium">Rutin Bulanan (Recurring)</label>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium italic text-slate-500">Jika Rutin:</label>
                <div className="flex items-center gap-2">
                    <span className="text-sm">Dibayar setiap tanggal</span>
                    <input
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
                <label className="text-sm font-medium italic text-slate-500">Jika Sekali Jalan:</label>
                <input
                    name="expectedDate"
                    type="date"
                    defaultValue={income.expectedDate ? new Date(income.expectedDate).toISOString().slice(0,10) : ""}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                />
            </div>
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

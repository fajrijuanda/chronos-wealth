"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
import { createTransaction } from "@/actions/transaction";
import { useRouter } from "next/navigation";

export function AddExpenseDialog({ categories }: { categories: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState<string>((categories[0] ?? "").toUpperCase());
  const { showLoading, showSuccess, showError } = useStatus();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const description = String(formData.get("description") ?? "");
    const amount = Number(formData.get("amount") ?? 0);
    const category = String(formData.get("category") ?? "");
    const dateStr = String(formData.get("date") ?? "");

    startTransition(async () => {
        showLoading("Mencatat pengeluaran...");
        try {
            await createTransaction({
                type: "EXPENSE",
                amount,
                description,
                expenseCategory: category,
                date: dateStr ? new Date(dateStr) : new Date(),
            });
            showSuccess("Pengeluaran berhasil dicatat.");
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal mencatat pengeluaran.";
            showError(message);
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 h-auto">
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-112.5">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
          <DialogDescription>
            Catat pengeluaran harianmu untuk pantau sisa budget bulan ini.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Keterangan</label>
            <input
              name="description"
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
              placeholder="Beli kopi, Makan siang, dll."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jumlah (Rp)</label>
              <input
                name="amount"
                type="number"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                placeholder="50000"
              />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Kategori</label>
                <input type="hidden" name="category" value={categoryValue} />
                <Select value={categoryValue} onValueChange={setCategoryValue}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => {
                      const value = cat.toUpperCase();
                      return (
                        <SelectItem key={value} value={value}>
                          {cat}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tanggal</label>
            <input
              title="Tanggal pengeluaran"
              name="date"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-rose-600 hover:bg-rose-700 text-white">
              {isPending ? "Saving..." : "Save Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

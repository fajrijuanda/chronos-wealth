"use client";

import { useState, useTransition } from "react";
import { Edit2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
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
import { updateTransaction } from "@/actions/transaction";
import { useRouter } from "next/navigation";

const NO_CATEGORY_VALUE = "__NO_CATEGORY__";

interface Expense {
    id: string;
    description: string;
    amount: number;
    date: Date;
    expenseCategory: string | null;
}

export function EditExpenseDialog({ expense, categories }: { expense: Expense, categories: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState<string>(expense.expenseCategory ?? NO_CATEGORY_VALUE);
  const { showLoading, showSuccess, showError } = useStatus();
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const description = String(formData.get("description") ?? "");
    const amount = Number(formData.get("amount") ?? 0);
    const dateRaw = String(formData.get("date") ?? "");
    const category = String(formData.get("category") ?? "");

    if (!description || amount <= 0) return;

    startTransition(async () => {
        showLoading("Memperbarui pengeluaran...");
        try {
            await updateTransaction(expense.id, {
                description,
                amount,
                date: dateRaw ? new Date(dateRaw) : undefined,
                expenseCategory: category || null
            });
            showSuccess("Pengeluaran berhasil diperbarui.");
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal memperbarui pengeluaran.";
            showError(message);
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600 h-8 w-8">
            <Edit2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Edit Pengeluaran</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Deskripsi</label>
            <input
              name="description"
              required
              defaultValue={expense.description}
              placeholder="Contoh: Makan Siang"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Jumlah (Rp)</label>
            <input
              title="Jumlah pengeluaran"
              name="amount"
              type="number"
              required
              defaultValue={expense.amount}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tanggal</label>
            <input
              title="Tanggal pengeluaran"
              name="date"
              type="date"
              required
              defaultValue={new Date(expense.date).toISOString().slice(0, 10)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Kategori</label>
            <input
              type="hidden"
              name="category"
              value={categoryValue === NO_CATEGORY_VALUE ? "" : categoryValue}
            />
            <Select value={categoryValue} onValueChange={setCategoryValue}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY_VALUE}>Tanpa Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Update Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

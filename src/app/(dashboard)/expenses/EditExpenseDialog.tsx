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
import { useStatus } from "@/components/providers/StatusProvider";
import { updateTransaction } from "@/actions/transaction";
import { useRouter } from "next/navigation";

interface Expense {
    id: string;
    description: string;
    amount: number;
    date: Date;
    expenseCategory: string | null;
}

export function EditExpenseDialog({ expense, categories }: { expense: Expense, categories: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
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
      <DialogContent className="sm:max-w-[425px]">
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
              name="date"
              type="date"
              required
              defaultValue={new Date(expense.date).toISOString().slice(0, 10)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Kategori</label>
            <select
                name="category"
                defaultValue={expense.expenseCategory ?? ""}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 appearance-none"
            >
                <option value="" disabled>Pilih Kategori</option>
                {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
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

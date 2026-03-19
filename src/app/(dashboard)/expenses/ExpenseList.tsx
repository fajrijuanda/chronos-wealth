"use client";

import { useTransition } from "react";
import { Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatGroupedNumber } from "@/lib/number-format";
import { useStatus } from "@/components/providers/StatusProvider";
import { deleteTransaction } from "@/actions/transaction";
import { useRouter } from "next/navigation";

interface Expense {
    id: string;
    description: string;
    amount: number;
    date: Date;
    expenseCategory: string | null;
}

export function ExpenseList({ expenses }: { expenses: Expense[] }) {
  const { showConfirm, showLoading, showSuccess, showError } = useStatus();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = (id: string, name: string) => {
    showConfirm({
      title: "Hapus Catatan Pengeluaran?",
      message: `Apakah Anda yakin ingin menghapus catatan "${name}"?`,
      confirmLabel: "Hapus",
      onConfirm: () => {
        startTransition(async () => {
          showLoading("Menghapus data...");
          try {
            await deleteTransaction(id);
            showSuccess("Catatan pengeluaran berhasil dihapus.");
            router.refresh();
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menghapus data.";
            showError(message);
          }
        });
      },
    });
  };

  if (expenses.length === 0) {
      return (
          <div className="text-center py-10 text-slate-500">
              Belum ada catatan pengeluaran bulan ini.
          </div>
      );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg mb-2">Recent Expenses</h3>
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {expenses.map((exp) => (
            <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <ShoppingCart className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{exp.description}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(exp.date).toLocaleDateString()} • <span className="uppercase">{exp.expenseCategory}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold text-rose-600 dark:text-rose-400">
                  Rp {formatGroupedNumber(exp.amount)}
                </p>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-slate-400 hover:text-rose-600 transition-colors h-8 w-8"
                    onClick={() => handleDelete(exp.id, exp.description)}
                    disabled={isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatGroupedNumber } from "@/lib/number-format";
import { useStatus } from "@/components/providers/StatusProvider";
import { deleteTransaction } from "@/actions/transaction";
import { useRouter } from "next/navigation";
import { formatJakartaDate } from "@/lib/date-format";
import { ManagementTable, type TableColumn, type TableFilter } from "@/components/ui/management-table";

import { EditExpenseDialog } from "./EditExpenseDialog";

interface Expense {
    id: string;
    description: string;
    amount: number;
    date: Date;
    expenseCategory: string | null;
}

export function ExpenseList({ expenses, categories }: { expenses: Expense[], categories: string[] }) {
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

  const columns: Array<TableColumn<Expense>> = [
    {
      key: "description",
      label: "Expense",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-slate-100 p-1.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <ShoppingCart className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold">{row.description}</span>
        </div>
      ),
      exportValue: (row) => row.description,
      sortValue: (row) => row.description,
    },
    {
      key: "category",
      label: "Category",
      render: (row) => row.expenseCategory ?? "UNCATEGORIZED",
      exportValue: (row) => row.expenseCategory ?? "UNCATEGORIZED",
      sortValue: (row) => row.expenseCategory ?? "UNCATEGORIZED",
    },
    {
      key: "date",
      label: "Date",
      render: (row) => formatJakartaDate(row.date),
      exportValue: (row) => formatJakartaDate(row.date),
      sortValue: (row) => row.date,
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => <span className="font-semibold text-rose-600 dark:text-rose-400">Rp {formatGroupedNumber(row.amount)}</span>,
      exportValue: (row) => row.amount,
      sortValue: (row) => row.amount,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <EditExpenseDialog expense={row} categories={categories} />
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-slate-400 hover:text-rose-600"
            onClick={() => handleDelete(row.id, row.description)}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
      exportValue: () => "",
      disableSort: true,
    },
  ];

  const filters: Array<TableFilter<Expense>> = categories.map((category) => ({
    value: category.toLowerCase(),
    label: category,
    predicate: (row) => (row.expenseCategory ?? "").toLowerCase() === category.toLowerCase(),
  }));

  return (
    <ManagementTable
      title="Expense Records"
      subtitle="Gunakan filter kategori, pilih baris, lalu export sesuai data yang terlihat atau dipilih."
      rows={expenses}
      columns={columns}
      filters={filters}
      searchableText={(row) => `${row.description} ${row.expenseCategory ?? "uncategorized"}`}
      emptyMessage="Belum ada catatan pengeluaran bulan ini."
      exportFileName="expense-records"
    />
  );
}

"use client";

import { CheckCircle2, CircleOff, Wallet } from "lucide-react";
import { CategoryType } from "@prisma/client";
import { formatGroupedNumber } from "@/lib/number-format";
import { formatJakartaDate, formatJakartaDateTime } from "@/lib/date-format";
import { ManagementTable, type TableColumn, type TableFilter } from "@/components/ui/management-table";
import { IncomeTableRowActions } from "./IncomeTableRowActions";

type IncomeRow = {
  id: string;
  name: string;
  category: CategoryType;
  amount: number;
  isRecurring: boolean;
  payoutDate: number | null;
  expectedDate: Date | null;
  isActive: boolean;
};

type SalesRow = {
  id: string;
  month: number;
  year: number;
  boothName: string;
  grossIncome: number;
  netIncome: number | null;
  uploadedBy: string;
  uploadedAt: Date;
};

export function IncomeDataTables({
  incomes,
  salesHistory,
}: {
  incomes: IncomeRow[];
  salesHistory: SalesRow[];
}) {
  const incomeColumns: Array<TableColumn<IncomeRow>> = [
    {
      key: "name",
      label: "User Income",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-indigo-100 p-1.5 text-indigo-700 dark:bg-indigo-900/35 dark:text-indigo-300">
            <Wallet className="h-3.5 w-3.5" />
          </span>
          <span className="font-semibold">{row.name}</span>
        </div>
      ),
      exportValue: (row) => row.name,
    },
    {
      key: "role",
      label: "Category",
      render: (row) => row.category,
      exportValue: (row) => row.category,
    },
    {
      key: "plan",
      label: "Plan",
      render: (row) => (row.isRecurring ? "Recurring" : "One-Time"),
      exportValue: (row) => (row.isRecurring ? "Recurring" : "One-Time"),
    },
    {
      key: "billing",
      label: "Billing",
      render: (row) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Rp {formatGroupedNumber(row.amount)}</span>
      ),
      exportValue: (row) => row.amount,
    },
    {
      key: "schedule",
      label: "Schedule",
      render: (row) =>
        row.isRecurring
          ? `Every ${row.payoutDate ?? "-"}th`
          : (row.expectedDate ? formatJakartaDate(row.expectedDate) : "-"),
      exportValue: (row) =>
        row.isRecurring
          ? `Every ${row.payoutDate ?? "-"}th`
          : (row.expectedDate ? formatJakartaDate(row.expectedDate) : "-"),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        row.isActive ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <CircleOff className="h-3.5 w-3.5" /> Inactive
          </span>
        )
      ),
      exportValue: (row) => (row.isActive ? "Active" : "Inactive"),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      render: (row) => (
        <div className="flex justify-end">
          <IncomeTableRowActions income={row} />
        </div>
      ),
      exportValue: () => "",
    },
  ];

  const incomeFilters: Array<TableFilter<IncomeRow>> = [
    { value: "active", label: "Active", predicate: (row) => row.isActive },
    { value: "inactive", label: "Inactive", predicate: (row) => !row.isActive },
    { value: "recurring", label: "Recurring", predicate: (row) => row.isRecurring },
    { value: "one-time", label: "One-Time", predicate: (row) => !row.isRecurring },
  ];

  const salesColumns: Array<TableColumn<SalesRow>> = [
    {
      key: "period",
      label: "Period",
      render: (row) => `${row.month}/${row.year}`,
      exportValue: (row) => `${row.month}/${row.year}`,
    },
    {
      key: "booth",
      label: "Booth",
      render: (row) => <span className="font-semibold">{row.boothName}</span>,
      exportValue: (row) => row.boothName,
    },
    {
      key: "gross",
      label: "Gross",
      render: (row) => `Rp ${formatGroupedNumber(row.grossIncome)}`,
      exportValue: (row) => row.grossIncome,
    },
    {
      key: "net",
      label: "Net",
      render: (row) => (row.netIncome !== null ? `Rp ${formatGroupedNumber(row.netIncome)}` : "-"),
      exportValue: (row) => row.netIncome ?? 0,
    },
    {
      key: "uploadedBy",
      label: "Uploaded By",
      render: (row) => row.uploadedBy,
      exportValue: (row) => row.uploadedBy,
    },
    {
      key: "uploadedAt",
      label: "Uploaded At",
      render: (row) => formatJakartaDateTime(row.uploadedAt),
      exportValue: (row) => formatJakartaDateTime(row.uploadedAt),
    },
  ];

  return (
    <div className="space-y-6">
      <ManagementTable
        title="Income Sources"
        subtitle="Template tabel terpadu: filter, seleksi, dan export mengikuti data terfilter/terpilih."
        rows={incomes}
        columns={incomeColumns}
        filters={incomeFilters}
        searchableText={(row) => `${row.name} ${row.category} ${row.isRecurring ? "recurring" : "one-time"}`}
        exportFileName="income-sources"
        emptyMessage="No income sources found."
      />

      <ManagementTable
        title="Booth Sales History"
        subtitle="Riwayat upload penjualan booth."
        rows={salesHistory}
        columns={salesColumns}
        searchableText={(row) => `${row.boothName} ${row.uploadedBy} ${row.month}/${row.year}`}
        exportFileName="booth-sales-history"
        emptyMessage="No sales uploads yet."
      />
    </div>
  );
}

"use client";

import { CheckCircle2, CircleOff, Wallet, Briefcase, Code2, TrendingUp, Coins, Building2 } from "lucide-react";
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

function getCategoryBadge(category: CategoryType) {
  const categoryConfig: Record<CategoryType, { label: string; icon: React.ReactNode; bgColor: string; textColor: string }> = {
    SALARY: {
      label: "Salary",
      icon: <Briefcase className="h-3.5 w-3.5" />,
      bgColor: "bg-blue-100 dark:bg-blue-900/35",
      textColor: "text-blue-700 dark:text-blue-300"
    },
    PROJECT: {
      label: "Project",
      icon: <Code2 className="h-3.5 w-3.5" />,
      bgColor: "bg-purple-100 dark:bg-purple-900/35",
      textColor: "text-purple-700 dark:text-purple-300"
    },
    COMMISSION: {
      label: "Commission",
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      bgColor: "bg-amber-100 dark:bg-amber-900/35",
      textColor: "text-amber-700 dark:text-amber-300"
    },
    STOCK: {
      label: "Stock",
      icon: <Coins className="h-3.5 w-3.5" />,
      bgColor: "bg-cyan-100 dark:bg-cyan-900/35",
      textColor: "text-cyan-700 dark:text-cyan-300"
    },
    SAAS: {
      label: "SaaS",
      icon: <Code2 className="h-3.5 w-3.5" />,
      bgColor: "bg-green-100 dark:bg-green-900/35",
      textColor: "text-green-700 dark:text-green-300"
    },
    BOOTH: {
      label: "Booth",
      icon: <Building2 className="h-3.5 w-3.5" />,
      bgColor: "bg-rose-100 dark:bg-rose-900/35",
      textColor: "text-rose-700 dark:text-rose-300"
    },
  };

  const config = categoryConfig[category];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold ${config.bgColor} ${config.textColor}`}>
      {config.icon} {config.label}
    </span>
  );
}

export function IncomeDataTables({
  incomes,
  salesHistory,
  showSalesHistory = true,
}: {
  incomes: IncomeRow[];
  salesHistory: SalesRow[];
  showSalesHistory?: boolean;
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
      sortValue: (row) => row.name,
    },
    {
      key: "role",
      label: "Category",
      render: (row) => getCategoryBadge(row.category),
      exportValue: (row) => {
        const categoryConfig: Record<CategoryType, string> = {
          SALARY: "Salary",
          PROJECT: "Project",
          COMMISSION: "Commission",
          STOCK: "Stock",
          SAAS: "SaaS",
          BOOTH: "Booth",
        };
        return categoryConfig[row.category];
      },
      sortValue: (row) => row.category,
    },
    {
      key: "plan",
      label: "Plan",
      render: (row) => (row.isRecurring ? "Recurring" : "One-Time"),
      exportValue: (row) => (row.isRecurring ? "Recurring" : "One-Time"),
      sortValue: (row) => (row.isRecurring ? "Recurring" : "One-Time"),
    },
    {
      key: "billing",
      label: "Billing",
      render: (row) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">Rp {formatGroupedNumber(row.amount)}</span>
      ),
      exportValue: (row) => row.amount,
      sortValue: (row) => row.amount,
    },
    {
      key: "schedule",
      label: "Schedule",
      render: (row) =>
        row.isRecurring
          ? row.expectedDate
            ? `Every ${row.payoutDate ?? "-"}th (from ${formatJakartaDate(row.expectedDate)})`
            : `Every ${row.payoutDate ?? "-"}th`
          : (row.expectedDate ? formatJakartaDate(row.expectedDate) : "-"),
      exportValue: (row) =>
        row.isRecurring
          ? row.expectedDate
            ? `Every ${row.payoutDate ?? "-"}th (from ${formatJakartaDate(row.expectedDate)})`
            : `Every ${row.payoutDate ?? "-"}th`
          : (row.expectedDate ? formatJakartaDate(row.expectedDate) : "-"),
      sortValue: (row) => row.expectedDate || "",
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
      sortValue: (row) => (row.isActive ? "Active" : "Inactive"),
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
      disableSort: true,
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
      sortValue: (row) => row.year * 100 + row.month,
    },
    {
      key: "booth",
      label: "Booth",
      render: (row) => <span className="font-semibold">{row.boothName}</span>,
      exportValue: (row) => row.boothName,
      sortValue: (row) => row.boothName,
    },
    {
      key: "gross",
      label: "Gross",
      render: (row) => `Rp ${formatGroupedNumber(row.grossIncome)}`,
      exportValue: (row) => row.grossIncome,
      sortValue: (row) => row.grossIncome,
    },
    {
      key: "net",
      label: "Net",
      render: (row) => (row.netIncome !== null ? `Rp ${formatGroupedNumber(row.netIncome)}` : "-"),
      exportValue: (row) => row.netIncome ?? 0,
      sortValue: (row) => row.netIncome ?? 0,
    },
    {
      key: "uploadedBy",
      label: "Uploaded By",
      render: (row) => row.uploadedBy,
      exportValue: (row) => row.uploadedBy,
      sortValue: (row) => row.uploadedBy,
    },
    {
      key: "uploadedAt",
      label: "Uploaded At",
      render: (row) => formatJakartaDateTime(row.uploadedAt),
      exportValue: (row) => formatJakartaDateTime(row.uploadedAt),
      sortValue: (row) => row.uploadedAt,
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

      {showSalesHistory ? (
        <ManagementTable
          title="Booth Sales History"
          subtitle="Riwayat upload penjualan booth."
          rows={salesHistory}
          columns={salesColumns}
          searchableText={(row) => `${row.boothName} ${row.uploadedBy} ${row.month}/${row.year}`}
          exportFileName="booth-sales-history"
          emptyMessage="No sales uploads yet."
        />
      ) : null}
    </div>
  );
}

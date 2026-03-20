"use client";

import { BarChart3, CalendarDays, Landmark, TrendingDown, TrendingUp } from "lucide-react";
import { formatGroupedNumber } from "@/lib/number-format";
import { ManagementTable, type TableColumn, type TableFilter } from "@/components/ui/management-table";

type FinancialReportRow = {
  id: string;
  monthKey: string;
  monthLabel: string;
  incomeTotal: number;
  boothIncome: number;
  nonBoothIncome: number;
  expenseTotal: number;
  netCashflow: number;
  incomeTxCount: number;
  expenseTxCount: number;
  closingBalance: number;
  projectedNet: number;
  netVariance: number;
};

export function FinancialReportTable({ rows }: { rows: FinancialReportRow[] }) {
  const columns: Array<TableColumn<FinancialReportRow>> = [
    {
      key: "month",
      label: "Month",
      render: (row) => row.monthLabel,
      exportValue: (row) => row.monthLabel,
    },
    {
      key: "income",
      label: "Real Income",
      render: (row) => <span className="font-semibold text-emerald-600 dark:text-emerald-400">Rp {formatGroupedNumber(row.incomeTotal)}</span>,
      exportValue: (row) => row.incomeTotal,
    },
    {
      key: "boothIncome",
      label: "Booth",
      render: (row) => `Rp ${formatGroupedNumber(row.boothIncome)}`,
      exportValue: (row) => row.boothIncome,
    },
    {
      key: "nonBoothIncome",
      label: "Non-Booth",
      render: (row) => `Rp ${formatGroupedNumber(row.nonBoothIncome)}`,
      exportValue: (row) => row.nonBoothIncome,
    },
    {
      key: "expense",
      label: "Real Expense",
      render: (row) => <span className="font-semibold text-rose-600 dark:text-rose-400">Rp {formatGroupedNumber(row.expenseTotal)}</span>,
      exportValue: (row) => row.expenseTotal,
    },
    {
      key: "net",
      label: "Net",
      render: (row) => (
        <span className={row.netCashflow >= 0 ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-rose-600 dark:text-rose-400"}>
          Rp {formatGroupedNumber(row.netCashflow)}
        </span>
      ),
      exportValue: (row) => row.netCashflow,
    },
    {
      key: "projectedNet",
      label: "Projected Net",
      render: (row) => (
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
          Rp {formatGroupedNumber(row.projectedNet)}
        </span>
      ),
      exportValue: (row) => row.projectedNet,
    },
    {
      key: "variance",
      label: "Variance",
      render: (row) => (
        <span className={row.netVariance >= 0 ? "font-semibold text-emerald-600 dark:text-emerald-400" : "font-semibold text-rose-600 dark:text-rose-400"}>
          Rp {formatGroupedNumber(row.netVariance)}
        </span>
      ),
      exportValue: (row) => row.netVariance,
    },
    {
      key: "txCount",
      label: "Tx Count",
      render: (row) => `${row.incomeTxCount + row.expenseTxCount}`,
      exportValue: (row) => row.incomeTxCount + row.expenseTxCount,
    },
    {
      key: "closing",
      label: "Cumulative",
      render: (row) => `Rp ${formatGroupedNumber(row.closingBalance)}`,
      exportValue: (row) => row.closingBalance,
    },
  ];

  const filters: Array<TableFilter<FinancialReportRow>> = [
    {
      value: "positive",
      label: "Net Positive",
      predicate: (row) => row.netCashflow >= 0,
    },
    {
      value: "negative",
      label: "Net Negative",
      predicate: (row) => row.netCashflow < 0,
    },
  ];

  return (
    <ManagementTable
      title="Monthly Financial Correction"
      subtitle="Data real bulanan sebagai koreksi dari asumsi simulation."
      rows={rows}
      columns={columns}
      filters={filters}
      searchableText={(row) => `${row.monthLabel} ${row.monthKey}`}
      exportFileName="financial-report-monthly"
      emptyMessage="Belum ada data transaksi pada periode ini."
      actionSlot={
        <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
          <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Real Monthly</span>
          <span className="inline-flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" /> Simulation Correction</span>
        </div>
      }
    />
  );
}

export function FinancialReportTrendChart({ rows }: { rows: FinancialReportRow[] }) {
  const points = [...rows].reverse();
  const chartRows = points.slice(-12);

  if (chartRows.length === 0) {
    return null;
  }

  const values = chartRows.flatMap((row) => [
    row.incomeTotal,
    row.expenseTotal,
    row.netCashflow,
    row.projectedNet,
  ]);

  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const spread = Math.max(1, maxValue - minValue);

  const width = 760;
  const height = 220;
  const padding = 26;
  const step = chartRows.length > 1 ? (width - padding * 2) / (chartRows.length - 1) : 0;

  function y(value: number) {
    const normalized = (value - minValue) / spread;
    return height - padding - normalized * (height - padding * 2);
  }

  function buildPolyline(series: Array<number>) {
    return series
      .map((value, index) => `${padding + step * index},${y(value)}`)
      .join(" ");
  }

  const incomePoints = buildPolyline(chartRows.map((row) => row.incomeTotal));
  const expensePoints = buildPolyline(chartRows.map((row) => row.expenseTotal));
  const netPoints = buildPolyline(chartRows.map((row) => row.netCashflow));
  const projectedPoints = buildPolyline(chartRows.map((row) => row.projectedNet));
  const zeroY = y(0);

  return (
    <section className="surface-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Monthly Trend</h2>
          <p className="text-xs text-muted-foreground">Income, expense, actual net, dan projected net (maks 12 bulan).</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Income</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Expense</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-indigo-500" /> Actual Net</span>
          <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Projected Net</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-56 min-w-170 w-full rounded-2xl border border-border/70 bg-background/70 p-2">
          <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="currentColor" opacity="0.25" strokeDasharray="4 4" />
          <polyline fill="none" stroke="#10b981" strokeWidth="2.5" points={incomePoints} />
          <polyline fill="none" stroke="#f43f5e" strokeWidth="2.5" points={expensePoints} />
          <polyline fill="none" stroke="#6366f1" strokeWidth="2.5" points={netPoints} />
          <polyline fill="none" stroke="#f59e0b" strokeWidth="2.5" points={projectedPoints} />
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground sm:grid-cols-4 md:grid-cols-6">
        {chartRows.map((row) => (
          <div key={row.id} className="rounded-lg border border-border/60 px-2 py-1.5">
            <p className="font-semibold text-foreground/80">{row.monthLabel}</p>
            <p>Net: Rp {formatGroupedNumber(row.netCashflow)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FinancialReportSummaryCards({
  totalIncome,
  totalBoothIncome,
  totalNonBoothIncome,
  totalExpense,
  totalNetCashflow,
}: {
  totalIncome: number;
  totalBoothIncome: number;
  totalNonBoothIncome: number;
  totalExpense: number;
  totalNetCashflow: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      <article className="surface-card-soft p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Income</p>
        <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">Rp {formatGroupedNumber(totalIncome)}</p>
      </article>
      <article className="surface-card-soft p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Booth Income</p>
        <p className="mt-1 text-lg font-semibold">Rp {formatGroupedNumber(totalBoothIncome)}</p>
      </article>
      <article className="surface-card-soft p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Non-Booth Income</p>
        <p className="mt-1 text-lg font-semibold">Rp {formatGroupedNumber(totalNonBoothIncome)}</p>
      </article>
      <article className="surface-card-soft p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Expense</p>
        <p className="mt-1 text-lg font-semibold text-rose-600 dark:text-rose-400">Rp {formatGroupedNumber(totalExpense)}</p>
      </article>
      <article className="surface-card-soft p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Net Cashflow</p>
        <p className={totalNetCashflow >= 0 ? "mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400" : "mt-1 text-lg font-semibold text-rose-600 dark:text-rose-400"}>
          Rp {formatGroupedNumber(totalNetCashflow)}
        </p>
      </article>
    </div>
  );
}

export function FinancialReportLegend() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="surface-card-soft flex items-center gap-2 p-3 text-sm">
        <TrendingUp className="h-4 w-4 text-emerald-500" />
        <span>Income berasal dari transaksi INCOME</span>
      </div>
      <div className="surface-card-soft flex items-center gap-2 p-3 text-sm">
        <TrendingDown className="h-4 w-4 text-rose-500" />
        <span>Expense berasal dari transaksi EXPENSE</span>
      </div>
      <div className="surface-card-soft flex items-center gap-2 p-3 text-sm">
        <Landmark className="h-4 w-4 text-indigo-500" />
        <span>Cumulative = akumulasi net antar bulan</span>
      </div>
    </div>
  );
}

import Link from "next/link";
import { getMonthlyFinancialReport } from "@/actions/transaction";
import { simulateSingleUserGrowth } from "@/actions/simulation";
import { getActiveUserEmail } from "@/lib/active-user";
import { CsvActions } from "@/components/simulation/CsvActions";
import {
  FinancialReportLegend,
  FinancialReportSummaryCards,
  FinancialReportTable,
  FinancialReportTrendChart,
} from "./FinancialReportTable";

export const dynamic = "force-dynamic";

export default async function FinancialReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const activeEmail = await getActiveUserEmail(typeof sp.user === "string" ? sp.user : undefined);

  const monthsRaw = typeof sp.months === "string" ? Number(sp.months) : 12;
  const months = Number.isFinite(monthsRaw) ? Math.max(1, Math.min(36, Math.round(monthsRaw))) : 12;

  const simulationTargetDate = new Date();
  simulationTargetDate.setMonth(simulationTargetDate.getMonth() + (months - 1));
  simulationTargetDate.setDate(1);

  const [report, simulation] = await Promise.all([
    getMonthlyFinancialReport({ months }),
    simulateSingleUserGrowth({
      email: activeEmail,
      targetDate: simulationTargetDate,
    }),
  ]);

  const projectedNetByMonth = new Map<string, number>();
  for (const plan of simulation.primary.plans) {
    projectedNetByMonth.set(plan.monthKey, plan.monthlyIncome - plan.monthlyExpense);
  }

  const enrichedRows = report.rows.map((row) => {
    const projectedNet = projectedNetByMonth.get(row.monthKey) ?? 0;
    return {
      ...row,
      projectedNet,
      netVariance: row.netCashflow - projectedNet,
    };
  });

  const generatedAt = new Date().toISOString();
  const periodLabel = `${report.range.start.toISOString().slice(0, 10)}..${report.range.end.toISOString().slice(0, 10)}`;
  const auditHeader = [
    ["# Report", "Financial Report Audit"],
    ["# Generated At", generatedAt],
    ["# User", activeEmail],
    ["# Range", periodLabel],
    ["# Months", String(months)],
    ["# Notes", "Actual net = Income - Expense, Variance = Actual net - Projected net"],
  ];

  const auditColumns = [
    "Month Key",
    "Month Label",
    "Income",
    "Booth Income",
    "Non-Booth Income",
    "Expense",
    "Actual Net",
    "Projected Net",
    "Variance",
    "Income Tx Count",
    "Expense Tx Count",
    "Cumulative",
  ];

  const auditRows = enrichedRows.map((row) => [
    row.monthKey,
    row.monthLabel,
    String(row.incomeTotal),
    String(row.boothIncome),
    String(row.nonBoothIncome),
    String(row.expenseTotal),
    String(row.netCashflow),
    String(row.projectedNet),
    String(row.netVariance),
    String(row.incomeTxCount),
    String(row.expenseTxCount),
    String(row.closingBalance),
  ]);

  const auditCsv = [...auditHeader, [], auditColumns, ...auditRows]
    .map((line) => line.map((value) => `"${String(value).replaceAll("\"", '""')}"`).join(","))
    .join("\n");

  const auditFileName = `financial-report-audit-${new Date().toISOString().slice(0, 19).replaceAll(":", "-")}.csv`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Report</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Tabel data real bulanan untuk mengecek dan mengoreksi hasil proyeksi Simulation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[3, 6, 12, 24].map((value) => (
            <Link
              key={value}
              href={`/financial-report?months=${value}`}
              className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${months === value ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200" : "border-border/70 bg-card/70 hover:bg-accent"}`}
            >
              {value}M
            </Link>
          ))}
          <CsvActions
            csvContent={auditCsv}
            fileName={auditFileName}
            downloadLabel="Export Audit CSV"
            copyLabel="Copy Audit CSV"
          />
        </div>
      </div>

      <FinancialReportSummaryCards
        totalIncome={report.summary.totalIncome}
        totalBoothIncome={report.summary.totalBoothIncome}
        totalNonBoothIncome={report.summary.totalNonBoothIncome}
        totalExpense={report.summary.totalExpense}
        totalNetCashflow={report.summary.totalNetCashflow}
      />

      <FinancialReportLegend />

      <FinancialReportTrendChart rows={enrichedRows} />

      <FinancialReportTable rows={enrichedRows} />
    </div>
  );
}

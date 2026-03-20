"use server";

import { prisma } from "@/lib/prisma";
import { CategoryType, TxType } from "@prisma/client";
import { revalidatePath } from "next/cache";

type MonthlyFinancialReportRow = {
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
};

type MonthlyFinancialReportSummary = {
  totalIncome: number;
  totalBoothIncome: number;
  totalNonBoothIncome: number;
  totalExpense: number;
  totalNetCashflow: number;
};

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function toMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getTransactions(take: number = 50) {
  return await prisma.transaction.findMany({
    take,
    orderBy: { date: "desc" },
    include: { source: true },
  });
}

export async function createTransaction(data: {
  type: TxType;
  amount: number;
  description: string;
  sourceId?: string | null;
  expenseCategory?: string | null;
  date?: Date;
}) {
  const result = await prisma.transaction.create({
    data,
  });
  revalidatePath("/overview");
  revalidatePath("/expenses");
  revalidatePath("/income");
  return result;
}

export async function getDashboardMetrics() {
  const transactions = await prisma.transaction.findMany();

  let totalBalance = 0;
  let monthlyIncome = 0;
  let monthlyExpense = 0;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  transactions.forEach((tx) => {
    const d = new Date(tx.date);
    const inCurrentMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;

    if (tx.type === "INCOME") {
      totalBalance += tx.amount;
      if (inCurrentMonth) {
        monthlyIncome += tx.amount;
      }
    } else {
      totalBalance -= tx.amount;
      if (inCurrentMonth) {
        monthlyExpense += tx.amount;
      }
    }
  });

  return { totalBalance, monthlyIncome, monthlyExpense };
}

export async function updateTransaction(id: string, data: Partial<{
  amount: number;
  description: string;
  expenseCategory: string | null;
  date: Date;
}>) {
  const result = await prisma.transaction.update({
    where: { id },
    data,
  });
  revalidatePath("/overview");
  revalidatePath("/expenses");
  revalidatePath("/income");
  return result;
}

export async function deleteTransaction(id: string) {
  const result = await prisma.transaction.delete({
    where: { id },
  });
  revalidatePath("/overview");
  revalidatePath("/expenses");
  revalidatePath("/income");
  return result;
}

export async function getMonthlyFinancialReport(input?: {
  months?: number;
}): Promise<{
  rows: MonthlyFinancialReportRow[];
  summary: MonthlyFinancialReportSummary;
  range: { start: Date; end: Date; months: number };
}> {
  const months = Math.max(1, Math.min(60, Number(input?.months ?? 12)));
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  const start = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1, 0, 0, 0, 0);

  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      source: {
        select: {
          category: true,
        },
      },
    },
    orderBy: { date: "asc" },
  });

  const monthlyMap = new Map<string, MonthlyFinancialReportRow>();

  for (let index = 0; index < months; index += 1) {
    const monthDate = new Date(start.getFullYear(), start.getMonth() + index, 1);
    const monthKey = getMonthKey(monthDate);
    monthlyMap.set(monthKey, {
      id: monthKey,
      monthKey,
      monthLabel: getMonthLabel(monthDate),
      incomeTotal: 0,
      boothIncome: 0,
      nonBoothIncome: 0,
      expenseTotal: 0,
      netCashflow: 0,
      incomeTxCount: 0,
      expenseTxCount: 0,
      closingBalance: 0,
    });
  }

  for (const tx of transactions) {
    const bucketDate = toMonthStart(new Date(tx.date));
    const key = getMonthKey(bucketDate);
    const bucket = monthlyMap.get(key);
    if (!bucket) continue;

    if (tx.type === "INCOME") {
      bucket.incomeTotal += tx.amount;
      bucket.incomeTxCount += 1;
      if (tx.source?.category === CategoryType.BOOTH) {
        bucket.boothIncome += tx.amount;
      } else {
        bucket.nonBoothIncome += tx.amount;
      }
    } else {
      bucket.expenseTotal += tx.amount;
      bucket.expenseTxCount += 1;
    }
  }

  const rowsAsc = Array.from(monthlyMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  let runningBalance = 0;
  for (const row of rowsAsc) {
    row.netCashflow = row.incomeTotal - row.expenseTotal;
    runningBalance += row.netCashflow;
    row.closingBalance = runningBalance;
  }

  const summary = rowsAsc.reduce<MonthlyFinancialReportSummary>(
    (acc, row) => {
      acc.totalIncome += row.incomeTotal;
      acc.totalBoothIncome += row.boothIncome;
      acc.totalNonBoothIncome += row.nonBoothIncome;
      acc.totalExpense += row.expenseTotal;
      acc.totalNetCashflow += row.netCashflow;
      return acc;
    },
    {
      totalIncome: 0,
      totalBoothIncome: 0,
      totalNonBoothIncome: 0,
      totalExpense: 0,
      totalNetCashflow: 0,
    },
  );

  return {
    rows: [...rowsAsc].reverse(),
    summary,
    range: {
      start,
      end,
      months,
    },
  };
}

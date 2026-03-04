"use server";

import { prisma } from "@/lib/prisma";
import { TxType } from "@prisma/client";
import { revalidatePath } from "next/cache";

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

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  transactions.forEach((tx) => {
    if (tx.type === "INCOME") {
      totalBalance += tx.amount;
      const d = new Date(tx.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        monthlyIncome += tx.amount;
      }
    } else {
      totalBalance -= tx.amount;
    }
  });

  return { totalBalance, monthlyIncome };
}

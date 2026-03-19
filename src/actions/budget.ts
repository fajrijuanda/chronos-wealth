"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBudgetLimits() {
  return await prisma.budgetLimit.findMany();
}

export async function setBudgetLimit(data: {
  category: string;
  maxLimit: number;
  warningThreshold: number;
}) {
  const result = await prisma.budgetLimit.upsert({
    where: { category: data.category },
    update: {
      maxLimit: data.maxLimit,
      warningThreshold: data.warningThreshold,
    },
    create: {
      category: data.category,
      maxLimit: data.maxLimit,
      warningThreshold: data.warningThreshold,
    },
  });
  revalidatePath("/expenses");
  return result;
}

export async function getCategoryExpenseWarning(category: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const currentExpense = await prisma.transaction.aggregate({
    where: {
      type: "EXPENSE",
      expenseCategory: category,
      date: { gte: startOfMonth },
    },
    _sum: { amount: true },
  });

  const expenseValue = currentExpense._sum.amount ?? 0;

  const budget = await prisma.budgetLimit.findUnique({
    where: { category },
  });

  if (!budget)
    return { percentage: 0, isWarning: false, expenseValue, budgetLimit: 0 };

  const percentage = (expenseValue / budget.maxLimit) * 100;

  return {
    percentage,
    isWarning: percentage >= budget.warningThreshold,
    expenseValue,
    budgetLimit: budget.maxLimit,
  };
}

export async function deleteBudgetLimit(id: string) {
  const result = await prisma.budgetLimit.delete({
    where: { id },
  });
  revalidatePath("/expenses");
  return result;
}

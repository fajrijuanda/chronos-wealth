"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBudgetLimits() {
  return await prisma.budgetLimit.findMany({
    orderBy: { category: "asc" },
  });
}

export async function setBudgetLimit(data: {
  category: string;
  maxLimit: number;
  warningThreshold: number;
}) {
  const normalizedCategory = data.category.trim().toUpperCase();
  const result = await prisma.budgetLimit.upsert({
    where: { category: normalizedCategory },
    update: {
      maxLimit: data.maxLimit,
      warningThreshold: data.warningThreshold,
    },
    create: {
      category: normalizedCategory,
      maxLimit: data.maxLimit,
      warningThreshold: data.warningThreshold,
    },
  });
  revalidatePath("/budget");
  revalidatePath("/expenses");
  return result;
}

export async function setBudgetLimitsBulk(
  items: Array<{ category: string; maxLimit: number; warningThreshold: number }>,
) {
  if (!items.length) return [];

  const payload = items
    .map((item) => ({
      category: item.category.trim().toUpperCase(),
      maxLimit: Number(item.maxLimit),
      warningThreshold: Number(item.warningThreshold),
    }))
    .filter((item) => item.category && item.maxLimit > 0 && item.warningThreshold > 0);

  if (!payload.length) return [];

  const result = await prisma.$transaction(
    payload.map((item) =>
      prisma.budgetLimit.upsert({
        where: { category: item.category },
        update: {
          maxLimit: item.maxLimit,
          warningThreshold: item.warningThreshold,
        },
        create: {
          category: item.category,
          maxLimit: item.maxLimit,
          warningThreshold: item.warningThreshold,
        },
      }),
    ),
  );

  revalidatePath("/budget");
  revalidatePath("/expenses");
  return result;
}

export async function getBudgetCategorySuggestions() {
  const txCategories = await prisma.transaction.findMany({
    where: {
      type: "EXPENSE",
      expenseCategory: { not: null },
    },
    select: { expenseCategory: true },
    distinct: ["expenseCategory"],
    orderBy: { expenseCategory: "asc" },
  });

  const presets = [
    "FOOD",
    "LIFESTYLE",
    "TRANSPORT",
    "HEALTH",
    "ENTERTAINMENT",
    "UTILITIES",
    "EDUCATION",
    "BUSINESS",
    "OTHERS",
  ];

  const merged = new Set<string>(presets);
  for (const row of txCategories) {
    if (row.expenseCategory) merged.add(row.expenseCategory.trim().toUpperCase());
  }

  return Array.from(merged).sort((a, b) => a.localeCompare(b));
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
  revalidatePath("/budget");
  revalidatePath("/expenses");
  return result;
}

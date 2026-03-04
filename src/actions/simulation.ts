"use server";

import { prisma } from "@/lib/prisma";
import { getDashboardMetrics } from "./transaction";
import { differenceInMonths } from "date-fns";

export async function calculateSimulation(
  targetDate: Date,
  monthlyExpenseBase: number,
) {
  const { totalBalance } = await getDashboardMetrics();

  const today = new Date();
  const monthsDiff = differenceInMonths(targetDate, today);

  if (monthsDiff <= 0) {
    return { projectedBalance: totalBalance, breakdown: [] };
  }

  // Get active recurring incomes
  const recurringIncomes = await prisma.incomeSource.findMany({
    where: { isRecurring: true, isActive: true },
  });

  const totalMonthlyIncome = recurringIncomes.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );

  // Get pending one-time incomes within the timeframe
  const oneTimeIncomes = await prisma.incomeSource.findMany({
    where: {
      isRecurring: false,
      expectedDate: {
        gte: today,
        lte: targetDate,
      },
    },
  });

  const totalOneTimeIncome = oneTimeIncomes.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );

  // Get saving goals whose deadlines are within the timeframe
  const savingGoals = await prisma.savingGoal.findMany({
    where: {
      deadline: {
        gte: today,
        lte: targetDate,
      },
    },
  });

  // Calculate remaining target amounts to be saved
  let totalSavedNeeded = 0;
  for (const goal of savingGoals) {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining > 0) totalSavedNeeded += remaining;
  }

  // Calculate Net Flow
  const totalInflow = totalMonthlyIncome * monthsDiff + totalOneTimeIncome;
  const totalOutflow = monthlyExpenseBase * monthsDiff + totalSavedNeeded;

  const projectedBalance = totalBalance + totalInflow - totalOutflow;

  const breakdown = [
    { label: "Current Balance", amount: totalBalance, type: "neutral" },
    {
      label: `Recurring Income (${monthsDiff} mo)`,
      amount: totalMonthlyIncome * monthsDiff,
      type: "positive",
    },
    {
      label: "One-time Projects",
      amount: totalOneTimeIncome,
      type: "positive",
    },
    {
      label: `Base Expenses (${monthsDiff} mo)`,
      amount: -(monthlyExpenseBase * monthsDiff),
      type: "negative",
    },
    {
      label: "Saving Goals Fulfillment",
      amount: -totalSavedNeeded,
      type: "negative",
    },
  ];

  return { projectedBalance, breakdown };
}

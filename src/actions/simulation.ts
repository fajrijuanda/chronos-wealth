"use server";

import {
  addMonths,
  differenceInMonths,
  format,
  getDate,
  lastDayOfMonth,
  startOfMonth,
} from "date-fns";
import { BoothPurchaseTiming } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDashboardMetrics } from "./transaction";
import { ensureAppUserByEmail, getUserBoothPortfolio } from "./collaboration";
import { getIncomeSourcesByUserId } from "./income";

type CashflowBreakdownItem = {
  label: string;
  amount: number;
  type: "positive" | "negative" | "neutral";
};

type SimUserInput = {
  email: string;
  fallbackBoothPrice: number;
  fallbackExpenseMin: number;
  fallbackExpenseMax: number;
  fallbackOpeningBalance: number;
  fallbackPurchaseTiming: BoothPurchaseTiming;
  fallbackPurchaseDayOverride?: number;
  revenuePerBooth: number;
};

function clampDay(day: number, min: number, max: number) {
  return Math.max(min, Math.min(max, day));
}

function getMonthIncomeTotal(incomes: Array<{ amount: number; isRecurring: boolean; expectedDate: Date | null }>, monthDate: Date) {
  const month = monthDate.getMonth();
  const year = monthDate.getFullYear();

  return incomes.reduce((acc, income) => {
    if (income.isRecurring) return acc + income.amount;

    if (!income.expectedDate) return acc;
    if (income.expectedDate.getMonth() === month && income.expectedDate.getFullYear() === year) {
      return acc + income.amount;
    }

    return acc;
  }, 0);
}

function getIncomeBeforeOrOnDay(
  incomes: Array<{
    amount: number;
    isRecurring: boolean;
    payoutDate: number | null;
    expectedDate: Date | null;
  }>,
  monthDate: Date,
  purchaseDay: number,
) {
  const month = monthDate.getMonth();
  const year = monthDate.getFullYear();

  return incomes.reduce((acc, income) => {
    if (income.isRecurring) {
      const payoutDay = clampDay(income.payoutDate ?? 1, 1, 31);
      if (payoutDay <= purchaseDay) return acc + income.amount;
      return acc;
    }

    if (!income.expectedDate) return acc;
    if (income.expectedDate.getMonth() !== month || income.expectedDate.getFullYear() !== year) {
      return acc;
    }

    if (getDate(income.expectedDate) <= purchaseDay) {
      return acc + income.amount;
    }

    return acc;
  }, 0);
}

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

  const recurringIncomes = await prisma.incomeSource.findMany({
    where: { isRecurring: true, isActive: true },
  });

  const totalMonthlyIncome = recurringIncomes.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );

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

  const savingGoals = await prisma.savingGoal.findMany({
    where: {
      deadline: {
        gte: today,
        lte: targetDate,
      },
    },
  });

  let totalSavedNeeded = 0;
  for (const goal of savingGoals) {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (remaining > 0) totalSavedNeeded += remaining;
  }

  const totalInflow = totalMonthlyIncome * monthsDiff + totalOneTimeIncome;
  const totalOutflow = monthlyExpenseBase * monthsDiff + totalSavedNeeded;

  const projectedBalance = totalBalance + totalInflow - totalOutflow;

  const breakdown: CashflowBreakdownItem[] = [
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

async function simulateUserBoothPlan(input: {
  targetDate: Date;
  simUser: SimUserInput;
}) {
  const user = await ensureAppUserByEmail({
    email: input.simUser.email,
    boothBasePrice: input.simUser.fallbackBoothPrice,
  });

  const [financeProfile, incomeSources, target, portfolio] = await Promise.all([
    prisma.userFinanceProfile.findUnique({ where: { userId: user.id } }),
    getIncomeSourcesByUserId(user.id),
    prisma.userBoothTarget.findUnique({ where: { userId: user.id } }),
    getUserBoothPortfolio(user.id),
  ]);

  const revenuePerBooth = target?.revenuePerBooth ?? input.simUser.revenuePerBooth;
  const targetBoothEquivalent = target?.targetBoothEquivalent ?? 0;
  const boothPrice = user.boothBasePrice;

  let cash = financeProfile?.openingBalance ?? input.simUser.fallbackOpeningBalance;
  const monthlyExpense =
    ((financeProfile?.monthlyExpenseMin ?? input.simUser.fallbackExpenseMin) +
      (financeProfile?.monthlyExpenseMax ?? input.simUser.fallbackExpenseMax)) /
    2;

  const purchaseTiming =
    financeProfile?.purchaseTiming ?? input.simUser.fallbackPurchaseTiming;

  const existingEquivalent = portfolio.reduce((acc, item) => {
    const monthlyShare = item.expectedMonthlyIncome * (item.revenueSharePct / 100);
    return acc + monthlyShare / revenuePerBooth;
  }, 0);

  let boothEquivalentOwned = existingEquivalent;

  const plans: Array<{
    month: string;
    purchaseDay: number;
    cashBeforePurchase: number;
    monthlyIncome: number;
    monthlyExpense: number;
    boothsAdded: number;
    totalBoothsEquivalent: number;
    monthEndCash: number;
  }> = [];

  const start = startOfMonth(new Date());
  const totalMonths = differenceInMonths(startOfMonth(input.targetDate), start);

  for (let i = 0; i <= totalMonths; i++) {
    const monthDate = addMonths(start, i);
    const monthEndDate = lastDayOfMonth(monthDate);
    const daysInMonth = getDate(monthEndDate);

    const profileDay = financeProfile?.purchaseDayOverride;
    const defaultPurchaseDay =
      purchaseTiming === BoothPurchaseTiming.START_OF_MONTH ? 1 : daysInMonth;
    const purchaseDay = profileDay
      ? clampDay(profileDay, 1, daysInMonth)
      : defaultPurchaseDay;

    const incomeBeforePurchase = getIncomeBeforeOrOnDay(incomeSources, monthDate, purchaseDay);
    const monthlyIncomeFromSources = getMonthIncomeTotal(incomeSources, monthDate);
    const incomeAfterPurchase = monthlyIncomeFromSources - incomeBeforePurchase;

    const boothIncomeThisMonth = boothEquivalentOwned * revenuePerBooth;

    cash += incomeBeforePurchase;
    const cashBeforePurchase = cash;

    const safeCashForBooth = Math.max(0, cashBeforePurchase - monthlyExpense);
    const boothsAdded = Math.floor(safeCashForBooth / boothPrice);
    const capitalUsed = boothsAdded * boothPrice;

    cash -= capitalUsed;
    cash += incomeAfterPurchase;
    cash += boothIncomeThisMonth;
    cash -= monthlyExpense;

    boothEquivalentOwned += boothsAdded;

    plans.push({
      month: format(monthDate, "MMM yyyy"),
      purchaseDay,
      cashBeforePurchase,
      monthlyIncome: monthlyIncomeFromSources + boothIncomeThisMonth,
      monthlyExpense,
      boothsAdded,
      totalBoothsEquivalent: boothEquivalentOwned,
      monthEndCash: cash,
    });
  }

  const projectedMonthlyIncome = boothEquivalentOwned * revenuePerBooth;

  return {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    boothPrice,
    revenuePerBooth,
    targetBoothEquivalent,
    purchaseTiming,
    monthlyExpense,
    projectedMonthlyIncome,
    boothEquivalentOwned,
    plans,
  };
}

export async function simulateCollaborativeGrowth(input: {
  targetDate: Date;
  primaryEmail: string;
  partnerEmail: string;
}) {
  const [primary, partner] = await Promise.all([
    simulateUserBoothPlan({
      targetDate: input.targetDate,
      simUser: {
        email: input.primaryEmail,
        fallbackBoothPrice: 7_500_000,
        fallbackExpenseMin: 1_000_000,
        fallbackExpenseMax: 1_000_000,
        fallbackOpeningBalance: 0,
        fallbackPurchaseTiming: BoothPurchaseTiming.START_OF_MONTH,
        revenuePerBooth: 1_000_000,
      },
    }),
    simulateUserBoothPlan({
      targetDate: input.targetDate,
      simUser: {
        email: input.partnerEmail,
        fallbackBoothPrice: 9_500_000,
        fallbackExpenseMin: 2_000_000,
        fallbackExpenseMax: 2_500_000,
        fallbackOpeningBalance: 0,
        fallbackPurchaseTiming: BoothPurchaseTiming.END_OF_MONTH,
        revenuePerBooth: 1_000_000,
      },
    }),
  ]);

  const totalProjectedIncome =
    primary.projectedMonthlyIncome + partner.projectedMonthlyIncome;

  return {
    targetDate: input.targetDate,
    primary,
    partner,
    combined: {
      totalProjectedIncome,
      totalBoothEquivalent:
        primary.boothEquivalentOwned + partner.boothEquivalentOwned,
    },
  };
}

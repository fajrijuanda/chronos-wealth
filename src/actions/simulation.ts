"use server";

import {
  addMonths,
  differenceInMonths,
  format,
  getDate,
  lastDayOfMonth,
  startOfMonth,
} from "date-fns";
import { BoothPackageType, BoothPurchaseTiming, CategoryType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatGroupedNumber } from "@/lib/number-format";
import { getDashboardMetrics } from "./transaction";
import { ensureAppUserByEmail } from "./collaboration";
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
  revenuePerBooth: number;
};

export type SimulationScenarioOptions = {
  includeExtraBoothCommission: boolean;
  includeExtraCashierPartners: boolean;
  includeExtraFreelance: boolean;
};

type DatedEvent = {
  day: number;
  amount: number;
  label: string;
};

type ContractEventType =
  | "capital_return"
  | "renewal"
  | "takeover"
  | "ended"
  | "partner_suggestion_with_purchase"
  | "partner_suggestion_without_purchase";

type ContractEvent = {
  day: number;
  amount: number;
  label: string;
  type: ContractEventType;
};

type SimulatedEconomyContract = {
  id: number;
  purchasedAt: Date;
  purchaseDay: number;
  payoutDay: number;
  capitalAmount: number;
  monthlyRevenue: number;
  ownCapitalAmount: number;
  patunganCapitalAmount: number;
};

const SALARY_DOUBLE_START_MONTH = new Date(2027, 4, 1);
const EXTRA_ONE_TIME_NON_BOOTH_MONTH = new Date(2026, 3, 1);
const EXTRA_BOOTH_COMMISSION_START_MONTH = new Date(2026, 4, 1);
const EXTRA_BOOTH_COMMISSION_PER_MONTH = 500_000;
const EXTRA_CASHIER_PARTNERS_PER_MONTH = 4_000_000;
const EXTRA_FREELANCE_PER_MONTH = 2_000_000;

function clampDay(day: number, min: number, max: number) {
  return Math.max(min, Math.min(max, day));
}

function contractDayAfterPurchase(day: number) {
  const nextDay = day + 1;
  return nextDay > 31 ? 1 : nextDay;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

function normalizeBoothIncomeKey(value: string) {
  return value
    .toLowerCase()
    .replace(/\(\s*booth\s*\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getBoothPayoutDay(packageType: BoothPackageType, mouSignedAt: Date) {
  const baseDay = getDate(mouSignedAt);
  const offset = packageType === BoothPackageType.EXCLUSIVE ? 0 : 1;
  const payoutDay = baseDay + offset;
  return payoutDay > 31 ? 1 : payoutDay;
}

function getBoothCommissionDay(mouSignedAt: Date, daysInMonth: number) {
  const baseDay = getDate(mouSignedAt);
  return clampDay(baseDay + 3, 1, daysInMonth);
}

function getContractEventType(label: string): ContractEventType | null {
  if (/patungan|partner/i.test(label)) {
    return "partner_suggestion_without_purchase";
  }

  if (/capital return/i.test(label)) {
    return "capital_return";
  }

  if (/contract renewal|exclusive renewal/i.test(label)) {
    return "renewal";
  }

  if (/phase 2/i.test(label)) {
    return "takeover";
  }

  if (/contract ended/i.test(label)) {
    return "ended";
  }

  return null;
}

function getAdjustedIncomeAmount(input: {
  amount: number;
  category: CategoryType;
  monthDate: Date;
}) {
  const shouldDoubleSalary =
    input.category === CategoryType.SALARY &&
    startOfMonth(input.monthDate) >= startOfMonth(SALARY_DOUBLE_START_MONTH);

  return shouldDoubleSalary ? input.amount * 2 : input.amount;
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
  startDate: Date;
  simUser: SimUserInput;
  scenarioOptions: SimulationScenarioOptions;
}) {
  const user = await ensureAppUserByEmail({
    email: input.simUser.email,
    boothBasePrice: input.simUser.fallbackBoothPrice,
  });

  const [financeProfile, incomeSources, target, ownerships, expenseTransactions, budgetAggregate] = await Promise.all([
    prisma.userFinanceProfile.findUnique({ where: { userId: user.id } }),
    getIncomeSourcesByUserId(user.id),
    prisma.userBoothTarget.findUnique({ where: { userId: user.id } }),
    prisma.boothOwnership.findMany({
      where: { userId: user.id },
      include: { booth: true },
    }),
    prisma.transaction.findMany({
      where: {
        type: "EXPENSE",
        date: {
          gte: startOfMonth(new Date()),
          lte: lastDayOfMonth(input.targetDate),
        },
      },
      select: {
        date: true,
        amount: true,
      },
    }),

    prisma.budgetLimit.aggregate({
      _sum: {
        maxLimit: true,
      },
    }),
  ]);

  // Build map from booth name to expectedDate for BOOTH category income sources
  const boothIncomeStartDates = new Map<string, Date>();
  for (const income of incomeSources) {
    if (income.category === CategoryType.BOOTH && income.expectedDate) {
      const incomeKey = normalizeBoothIncomeKey(income.name);
      const existingDate = boothIncomeStartDates.get(incomeKey);
      if (!existingDate || income.expectedDate < existingDate) {
        boothIncomeStartDates.set(incomeKey, income.expectedDate);
      }
    }
  }
  const boothIncomeStartDateEntries = Array.from(boothIncomeStartDates.entries());

  const revenuePerBooth = target?.revenuePerBooth ?? input.simUser.revenuePerBooth;
  const targetBoothEquivalent = target?.targetBoothEquivalent ?? 0;
  const boothPrice = user.boothBasePrice;

  const totalCapitalByBoothId = ownerships.reduce<Record<string, number>>(
    (acc, ownership) => {
      acc[ownership.boothId] = (acc[ownership.boothId] ?? 0) + ownership.capitalAmount;
      return acc;
    },
    {},
  );

  let cash = financeProfile?.openingBalance ?? input.simUser.fallbackOpeningBalance;

  const profileMin = financeProfile?.monthlyExpenseMin;
  const profileMax = financeProfile?.monthlyExpenseMax;
  const isDefaultProfileExpense =
    profileMin === input.simUser.fallbackExpenseMin &&
    profileMax === input.simUser.fallbackExpenseMax;
  const hasExplicitProfileExpense =
    financeProfile &&
    profileMin !== undefined &&
    profileMax !== undefined &&
    !isDefaultProfileExpense;
  const profileMonthlyExpenseBase = hasExplicitProfileExpense
    ? ((profileMin ?? 0) + (profileMax ?? 0)) / 2
    : 0;
  const monthlyBudgetCap = budgetAggregate._sum.maxLimit ?? 0;

  const expenseByMonth = expenseTransactions.reduce<Record<string, number>>((acc, tx) => {
    const key = monthKey(tx.date);
    acc[key] = (acc[key] ?? 0) + tx.amount;
    return acc;
  }, {});

  const purchaseTiming =
    financeProfile?.purchaseTiming ?? input.simUser.fallbackPurchaseTiming;

  const existingEquivalent = ownerships.reduce((acc, ownership) => {
    const monthlyShare =
      ownership.booth.expectedMonthlyIncome *
      ownership.booth.boothUnitCount *
      (ownership.revenueSharePct / 100);
    return acc + monthlyShare / revenuePerBooth;
  }, 0);

  let boothEquivalentOwned = existingEquivalent;
  let simulatedContractId = 1;
  const simulatedEconomyContracts: SimulatedEconomyContract[] = [];
  const holdingFundAccumulated = 0;
  const pt2FundAccumulated = 0;

  const includeHoldingPlan = false;
  const includePt2Plan = false;

  const idleCashTarget = financeProfile?.idleCashTarget ?? 1_000_000_000;
  const holdingLaunchDate = new Date();
  const pt2LaunchDate = new Date();
  const renewEconomyBoothContracts = financeProfile?.renewEconomyBoothContracts ?? true;
  const renewExclusiveBoothContracts =
    financeProfile?.renewExclusiveBoothContracts ?? true;

  const exclusiveExtraUnitsByOwnershipId = new Map<string, number>();

  const personalHoldingTarget = 0;
  const personalPt2Target = 0;

  const plans: Array<{
    monthKey: string;
    month: string;
    purchaseDay: number;
    unitTotalOwned: number;
    cashBeforePurchase: number;
    monthlyIncome: number;
    monthlyExpense: number;
    monthlyHoldingSaved: number;
    monthlyPt2Saved: number;
    reserveGuard: number;
    monthlyBoothIncome: number;
    monthlyBoothIncomeOwn: number;
    monthlyBoothIncomePatungan: number;
    monthlyCommissionIncome: number;
    monthlyNonBoothIncome: number;
    boothsAdded: number;
    totalBoothsEquivalent: number;
    boothsAvailableToBuy: number;
    boothsAvailableWithPatungan: number;
    boothPatunganShortage: number;
    monthEndCash: number;
    patunganTopUpApplied: number;
    contractEvents: ContractEvent[];
  }> = [];

  const start = startOfMonth(input.startDate);
  const totalMonths = differenceInMonths(startOfMonth(input.targetDate), start);
  let previousMonthEndCash = cash;
  let pendingPatunganTopUp = 0;

  for (let i = 0; i <= totalMonths; i++) {
    const monthDate = addMonths(start, i);
    const monthEndDate = lastDayOfMonth(monthDate);
    const daysInMonth = getDate(monthEndDate);

    const transactionExpense = expenseByMonth[monthKey(monthDate)] ?? 0;
    const monthlyExpense = monthlyBudgetCap > 0
      ? monthlyBudgetCap
      : profileMonthlyExpenseBase + transactionExpense;

    const profileDay = financeProfile?.purchaseDayOverride;
    const defaultPurchaseDay =
      purchaseTiming === BoothPurchaseTiming.START_OF_MONTH ? 1 : daysInMonth;
    const purchaseDay = profileDay
      ? clampDay(profileDay, 1, daysInMonth)
      : defaultPurchaseDay;

    const events: DatedEvent[] = [];
    let monthlyNonBoothIncome = 0;
    let monthlyCommissionIncome = 0;

    for (const income of incomeSources) {
      if (income.category === CategoryType.BOOTH) {
        // Booth payout is already computed from ownership records below.
        continue;
      }

      if (
        includeHoldingPlan &&
        income.category === CategoryType.STOCK &&
        startOfMonth(monthDate) < startOfMonth(holdingLaunchDate)
      ) {
        continue;
      }

      if (income.isRecurring) {
        if (income.expectedDate && startOfMonth(monthDate) < startOfMonth(income.expectedDate)) {
          continue;
        }

        // Check if contract has ended (for COMMISSION category with contractEndDate)
        if (income.category === CategoryType.COMMISSION && income.contractEndDate && startOfMonth(monthDate) > startOfMonth(income.contractEndDate)) {
          continue;
        }

        const adjustedIncomeAmount = getAdjustedIncomeAmount({
          amount: income.amount,
          category: income.category,
          monthDate,
        });

        const recurringDay = clampDay(income.payoutDate ?? 1, 1, daysInMonth);
        const firstMonthStartDay = income.expectedDate
          ? clampDay(getDate(income.expectedDate), 1, daysInMonth)
          : recurringDay;
        const eventDay =
          income.expectedDate && monthKey(income.expectedDate) === monthKey(monthDate)
            ? Math.max(recurringDay, firstMonthStartDay)
            : recurringDay;

        events.push({
          day: eventDay,
          amount: adjustedIncomeAmount,
          label: income.name,
        });
        if (income.category === CategoryType.COMMISSION) {
          monthlyCommissionIncome += adjustedIncomeAmount;
        } else {
          monthlyNonBoothIncome += adjustedIncomeAmount;
        }
        continue;
      }

      if (income.expectedDate && monthKey(income.expectedDate) === monthKey(monthDate)) {
        const adjustedIncomeAmount = getAdjustedIncomeAmount({
          amount: income.amount,
          category: income.category,
          monthDate,
        });

        events.push({
          day: clampDay(getDate(income.expectedDate), 1, daysInMonth),
          amount: adjustedIncomeAmount,
          label: income.name,
        });
        if (income.category === CategoryType.COMMISSION) {
          monthlyCommissionIncome += adjustedIncomeAmount;
        } else {
          monthlyNonBoothIncome += adjustedIncomeAmount;
        }
      }
    }

    if (
      input.scenarioOptions.includeExtraBoothCommission &&
      startOfMonth(monthDate) >= startOfMonth(EXTRA_BOOTH_COMMISSION_START_MONTH)
    ) {
      events.push({
        day: purchaseDay,
        amount: EXTRA_BOOTH_COMMISSION_PER_MONTH,
        label: "Skenario: +2 booth commission/bulan",
      });
      monthlyCommissionIncome += EXTRA_BOOTH_COMMISSION_PER_MONTH;
    }

    if (
      input.scenarioOptions.includeExtraCashierPartners &&
      monthKey(monthDate) === monthKey(EXTRA_ONE_TIME_NON_BOOTH_MONTH)
    ) {
      events.push({
        day: purchaseDay,
        amount: EXTRA_CASHIER_PARTNERS_PER_MONTH,
        label: "Skenario (sekali): +2 mitra kasir (Rp 2.000.000/mitra)",
      });
      monthlyNonBoothIncome += EXTRA_CASHIER_PARTNERS_PER_MONTH;
    }

    if (
      input.scenarioOptions.includeExtraFreelance &&
      monthKey(monthDate) === monthKey(EXTRA_ONE_TIME_NON_BOOTH_MONTH)
    ) {
      events.push({
        day: purchaseDay,
        amount: EXTRA_FREELANCE_PER_MONTH,
        label: "Skenario (sekali): freelance tambahan Rp 2.000.000",
      });
      monthlyNonBoothIncome += EXTRA_FREELANCE_PER_MONTH;
    }

    let monthlyBoothIncome = 0;
    let monthlyBoothIncomeOwn = 0;
    let monthlyBoothIncomePatungan = 0;
    let activeEquivalentFromOwned = 0;
    let ownedUnitTotal = 0;

    for (const ownership of ownerships) {
      const booth = ownership.booth;
      const monthsSinceMou = differenceInMonths(
        startOfMonth(monthDate),
        startOfMonth(booth.mouSignedAt),
      );

      if (monthsSinceMou < 0) {
        continue;
      }

      const cycleMonths = Math.max(1, booth.contractDurationMonths);
      const isRenewalMonth = monthsSinceMou > 0 && monthsSinceMou % cycleMonths === 0;
      const totalBoothCapital = totalCapitalByBoothId[booth.id] ?? ownership.capitalAmount;
      const capitalRatio = totalBoothCapital > 0 ? ownership.capitalAmount / totalBoothCapital : 0;

      const payoutDay = getBoothPayoutDay(
        booth.packageType,
        booth.mouSignedAt,
      );

      let boothActiveInMonth = true;

      if (booth.packageType === BoothPackageType.ECONOMY) {
        const contractExpired = monthsSinceMou >= cycleMonths;

        if (contractExpired && !renewEconomyBoothContracts) {
          boothActiveInMonth = false;
        }

        if (isRenewalMonth) {
          const capitalReturnDate = addMonths(booth.mouSignedAt, monthsSinceMou);
          events.push({
            day: clampDay(getDate(capitalReturnDate), 1, daysInMonth),
            amount: ownership.capitalAmount,
            label: `${booth.name} capital return`,
          });

          if (renewEconomyBoothContracts) {
            events.push({
              day: clampDay(getDate(capitalReturnDate), 1, daysInMonth),
              amount: -ownership.capitalAmount,
              label: `${booth.name} contract renewal`,
            });
          }
        }
      } else {
        if (monthsSinceMou >= cycleMonths && !renewExclusiveBoothContracts) {
          boothActiveInMonth = false;
          events.push({
            day: 1,
            amount: 0,
            label: `${booth.name} exclusive contract ended (auto-renew off)`,
          });
        }

        if (isRenewalMonth && renewExclusiveBoothContracts) {
          const renewalDate = addMonths(booth.mouSignedAt, monthsSinceMou);
          const renewalCapital = booth.exclusiveRenewalCapital * capitalRatio;
          events.push({
            day: clampDay(getDate(renewalDate), 1, daysInMonth),
            amount: -renewalCapital,
            label: `${booth.name} exclusive renewal`,
          });
        }

        if (
          renewExclusiveBoothContracts &&
          monthsSinceMou === booth.exclusivePhase2StartsAfterMonths
        ) {
          const previousExtraUnits = exclusiveExtraUnitsByOwnershipId.get(ownership.id) ?? 0;
          exclusiveExtraUnitsByOwnershipId.set(
            ownership.id,
            previousExtraUnits + booth.boothUnitCount,
          );
          events.push({
            day: clampDay(getDate(booth.mouSignedAt), 1, daysInMonth),
            amount: 0,
            label: `${booth.name} entered phase 2 takeover (+${booth.boothUnitCount} unit)`,
          });
        }
      }

      // Booth income starts from the month after MoU (not in signing month).
      // But if booth has expected start date from IncomeSource, use that instead.
      const boothKey = normalizeBoothIncomeKey(booth.name);
      let expectedIncomeDate = boothIncomeStartDates.get(boothKey);
      if (!expectedIncomeDate) {
        const fallback = boothIncomeStartDateEntries.find(
          ([incomeKey]) => incomeKey.includes(boothKey) || boothKey.includes(incomeKey),
        );
        expectedIncomeDate = fallback?.[1];
      }
      const incomeStartMonth = expectedIncomeDate ? startOfMonth(expectedIncomeDate) : null;
      const shouldIncludeIncome = incomeStartMonth
        ? startOfMonth(monthDate) >= incomeStartMonth
        : monthsSinceMou >= 1;

      if (boothActiveInMonth && shouldIncludeIncome) {
        const extraUnits = exclusiveExtraUnitsByOwnershipId.get(ownership.id) ?? 0;
        const baseUnits =
          booth.packageType === BoothPackageType.EXCLUSIVE && !booth.isShared
            ? 1
            : booth.boothUnitCount;
        const effectiveUnits = Math.max(1, baseUnits + extraUnits);
        const incomeAmount =
          booth.expectedMonthlyIncome *
          effectiveUnits *
          (ownership.revenueSharePct / 100);

        events.push({
          day: payoutDay,
          amount: incomeAmount,
          label: `${booth.name} payout`,
        });

        activeEquivalentFromOwned += incomeAmount / revenuePerBooth;
        monthlyBoothIncome += incomeAmount;
        monthlyBoothIncomeOwn += incomeAmount;
        ownedUnitTotal += effectiveUnits * (ownership.revenueSharePct / 100);
      }

      if (booth.packageType === BoothPackageType.ECONOMY) {
        const commissionAmount =
          booth.referralEconomyBooths *
          booth.referralCommissionPerBooth *
          (ownership.revenueSharePct / 100);

        if (commissionAmount > 0 && monthKey(booth.mouSignedAt) === monthKey(monthDate)) {
          const commissionDay = getBoothCommissionDay(
            booth.mouSignedAt,
            daysInMonth,
          );
          events.push({
            day: commissionDay,
            amount: commissionAmount,
            label: `${booth.name} referral commission`,
          });
          monthlyCommissionIncome += commissionAmount;
        }
      }
    }

    for (const contract of simulatedEconomyContracts) {
      const monthsSincePurchase = differenceInMonths(
        startOfMonth(monthDate),
        startOfMonth(contract.purchasedAt),
      );

      if (monthsSincePurchase < 0) {
        continue;
      }

      const cycleMonths = 24;
      const isRenewalMonth = monthsSincePurchase > 0 && monthsSincePurchase % cycleMonths === 0;
      const contractExpired = monthsSincePurchase >= cycleMonths;
      let boothActiveInMonth = true;

      if (contractExpired && !renewEconomyBoothContracts) {
        boothActiveInMonth = false;
      }

      if (isRenewalMonth) {
        events.push({
          day: clampDay(contract.purchaseDay, 1, daysInMonth),
          amount: contract.ownCapitalAmount,
          label: `Sim Booth ${contract.id} capital return`,
        });

        if (renewEconomyBoothContracts) {
          events.push({
            day: clampDay(contract.purchaseDay, 1, daysInMonth),
            amount: -contract.ownCapitalAmount,
            label: `Sim Booth ${contract.id} contract renewal`,
          });
        }
      }

      if (boothActiveInMonth) {
        ownedUnitTotal += 1;
      }

      if (boothActiveInMonth && monthsSincePurchase >= 1) {
        const payoutDay = clampDay(contract.payoutDay, 1, daysInMonth);
        
        // Calculate income split based on ownership percentages
        const totalCapital = contract.capitalAmount;
        const ownPct = totalCapital > 0 ? contract.ownCapitalAmount / totalCapital : 1;
        const patunganPct = totalCapital > 0 ? contract.patunganCapitalAmount / totalCapital : 0;
        
        const ownIncome = contract.monthlyRevenue * ownPct;
        const patunganIncome = contract.monthlyRevenue * patunganPct;
        
        events.push({
          day: payoutDay,
          amount: ownIncome,
          label: `Sim Booth ${contract.id} payout`,
        });
        monthlyBoothIncome += ownIncome;
        monthlyBoothIncomeOwn += ownIncome;
        monthlyBoothIncomePatungan += patunganIncome;
        activeEquivalentFromOwned +=
          revenuePerBooth > 0 ? ownIncome / revenuePerBooth : 0;
      }
    }

    events.sort((a, b) => a.day - b.day);

    const incomeBeforePurchase = events
      .filter((event) => event.day <= purchaseDay)
      .reduce((acc, event) => acc + event.amount, 0);

    const totalMonthEventsIncome = events.reduce((acc, event) => acc + event.amount, 0);
    const contractEvents: ContractEvent[] = events
      .map((event) => {
        const eventType = getContractEventType(event.label);
        if (!eventType) {
          return null;
        }

        return {
          day: event.day,
          amount: event.amount,
          label: event.label,
          type: eventType,
        };
      })
      .filter((event): event is ContractEvent => event !== null);
    const incomeAfterPurchase = totalMonthEventsIncome - incomeBeforePurchase;

    const patunganTopUpApplied = pendingPatunganTopUp;
    const ownCashAtMonthStart = previousMonthEndCash;
    const openingBalanceForMonth = ownCashAtMonthStart + patunganTopUpApplied;
    pendingPatunganTopUp = 0;
    cash = openingBalanceForMonth + incomeBeforePurchase;
    const cashBeforePurchase = openingBalanceForMonth;

    const reserveGuard = idleCashTarget;
    const remainingBoothNeed = Math.max(
      0,
      targetBoothEquivalent > 0 ? targetBoothEquivalent - boothEquivalentOwned : Number.POSITIVE_INFINITY,
    );
    const maxBoothByCash = boothPrice > 0 ? Math.floor(openingBalanceForMonth / boothPrice) : 0;
    const boothsAdded =
      targetBoothEquivalent > 0
        ? Math.min(maxBoothByCash, Math.floor(remainingBoothNeed))
        : maxBoothByCash;
    const capitalUsed = boothsAdded * boothPrice;

    cash -= capitalUsed;

    const actualHoldingSaved = 0;
    const actualPt2Saved = 0;

    cash += incomeAfterPurchase;
    const cashBeforeExpense = cash;

    // Calculate available booths from end cash (before expense)
    const boothsAvailableToBuy = boothPrice > 0 ? Math.floor(cashBeforeExpense / boothPrice) : 0;
    const remainderAfterAvailableBooths = cashBeforeExpense - (boothsAvailableToBuy * boothPrice);
    const boothsAvailableWithPatungan = remainderAfterAvailableBooths > 0 && remainderAfterAvailableBooths < boothPrice ? 1 : 0;
    const boothPatunganShortage = boothsAvailableWithPatungan > 0 ? boothPrice - remainderAfterAvailableBooths : 0;

    if (boothPatunganShortage > 0) {
      contractEvents.push({
        day: purchaseDay,
        amount: boothPatunganShortage,
        label:
          boothsAdded > 0
            ? `Saran patungan partner (setelah beli): kurang Rp ${formatGroupedNumber(boothPatunganShortage)} untuk 1 booth tambahan`
            : `Saran patungan partner (belum beli): kurang Rp ${formatGroupedNumber(boothPatunganShortage)} untuk 1 booth`,
        type: boothsAdded > 0 ? "partner_suggestion_with_purchase" : "partner_suggestion_without_purchase",
      });
      pendingPatunganTopUp += boothPatunganShortage;
    }

    cash -= monthlyExpense;
    previousMonthEndCash = cashBeforeExpense;

    let cumulativeOwnUsed = 0;
    let cumulativePatunganUsed = 0;

    for (let addedIndex = 0; addedIndex < boothsAdded; addedIndex++) {
      const simulatedPayoutDay = contractDayAfterPurchase(purchaseDay);
      
      // Allocate capital sources sequentially:
      // - First booth(s) from own cash
      // - Remaining booth(s) from patungan top-up
      const availableOwn = Math.max(0, ownCashAtMonthStart - cumulativeOwnUsed);
      const ownForThisBooth = Math.min(boothPrice, availableOwn);
      const patunganForThisBooth = boothPrice - ownForThisBooth;
      
      cumulativeOwnUsed += ownForThisBooth;
      cumulativePatunganUsed += patunganForThisBooth;
      
      simulatedEconomyContracts.push({
        id: simulatedContractId,
        purchasedAt: new Date(monthDate),
        purchaseDay,
        payoutDay: simulatedPayoutDay,
        capitalAmount: boothPrice,
        monthlyRevenue: revenuePerBooth,
        ownCapitalAmount: ownForThisBooth,
        patunganCapitalAmount: patunganForThisBooth,
      });
      simulatedContractId += 1;
    }

    const unitTotalOwned = ownedUnitTotal + boothsAdded;
    boothEquivalentOwned = unitTotalOwned;

    const totalPureIncome =
      monthlyBoothIncome + monthlyCommissionIncome + monthlyNonBoothIncome;
    const incomeEquivalent = revenuePerBooth > 0 ? totalPureIncome / revenuePerBooth : 0;

    plans.push({
      monthKey: format(monthDate, "yyyy-MM"),
      month: format(monthDate, "MMM yyyy"),
      purchaseDay,
      unitTotalOwned,
      cashBeforePurchase,
      monthlyIncome: totalPureIncome,
      monthlyExpense,
      monthlyHoldingSaved: actualHoldingSaved,
      monthlyPt2Saved: actualPt2Saved,
      reserveGuard,
      monthlyBoothIncome,
      monthlyBoothIncomeOwn,
      monthlyBoothIncomePatungan,
      monthlyCommissionIncome,
      monthlyNonBoothIncome,
      boothsAdded,
      totalBoothsEquivalent: incomeEquivalent,
      boothsAvailableToBuy,
      boothsAvailableWithPatungan,
      boothPatunganShortage,
      monthEndCash: cashBeforeExpense,
      patunganTopUpApplied,
      contractEvents,
    });
  }

  const latestPlan = plans[plans.length - 1];
  const projectedMonthlyIncome = latestPlan?.monthlyIncome ?? 0;
  const displayedEquivalent = latestPlan?.totalBoothsEquivalent ?? boothEquivalentOwned;

  return {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    boothPrice,
    revenuePerBooth,
    targetBoothEquivalent,
    purchaseTiming,
    includeHoldingPlan,
    includePt2Plan,
    monthlyExpense: monthlyBudgetCap > 0 ? monthlyBudgetCap : profileMonthlyExpenseBase,
    idleCashTarget,
    holdingFundAccumulated,
    personalHoldingTarget,
    holdingLaunchDate,
    pt2FundAccumulated,
    personalPt2Target,
    pt2LaunchDate,
    projectedMonthlyIncome,
    boothEquivalentOwned: displayedEquivalent,
    plans,
  };
}

export async function simulateCollaborativeGrowth(input: {
  targetDate: Date;
  startDate: Date;
  primaryEmail: string;
  partnerEmail: string;
  openingBalance?: number;
  scenarioOptions?: SimulationScenarioOptions;
}) {
  const scenarioOptions: SimulationScenarioOptions = {
    includeExtraBoothCommission: input.scenarioOptions?.includeExtraBoothCommission ?? false,
    includeExtraCashierPartners: input.scenarioOptions?.includeExtraCashierPartners ?? false,
    includeExtraFreelance: input.scenarioOptions?.includeExtraFreelance ?? false,
  };

  const [primary, partner] = await Promise.all([
    simulateUserBoothPlan({
      targetDate: input.targetDate,
      startDate: input.startDate,
      simUser: {
        email: input.primaryEmail,
        fallbackBoothPrice: 7_500_000,
        fallbackExpenseMin: 1_000_000,
        fallbackExpenseMax: 1_000_000,
        fallbackOpeningBalance: input.openingBalance ?? 0,
        fallbackPurchaseTiming: BoothPurchaseTiming.START_OF_MONTH,
        revenuePerBooth: 1_000_000,
      },
      scenarioOptions,
    }),
    simulateUserBoothPlan({
      targetDate: input.targetDate,
      startDate: input.startDate,
      simUser: {
        email: input.partnerEmail,
        fallbackBoothPrice: 9_500_000,
        fallbackExpenseMin: 2_000_000,
        fallbackExpenseMax: 2_500_000,
        fallbackOpeningBalance: input.openingBalance ?? 0,
        fallbackPurchaseTiming: BoothPurchaseTiming.END_OF_MONTH,
        revenuePerBooth: 1_000_000,
      },
      scenarioOptions,
    }),
  ]);

  const monthCount = Math.min(primary.plans.length, partner.plans.length);
  let primaryCashOffset = 0;
  let partnerCashOffset = 0;
  const ownerIsPrimary = primary.boothPrice <= partner.boothPrice;
  const collabBoothPrice = ownerIsPrimary ? primary.boothPrice : partner.boothPrice;
  const collabRevenuePerBooth = ownerIsPrimary ? primary.revenuePerBooth : partner.revenuePerBooth;
  type CollabBoothShare = {
    primaryShare: number;
    partnerShare: number;
    monthlyRevenue: number;
  };
  const activeCollabBooths: CollabBoothShare[] = [];
  const pendingCollabBooths: CollabBoothShare[] = [];

  for (let monthIndex = 0; monthIndex < monthCount; monthIndex++) {
    const primaryPlan = primary.plans[monthIndex];
    const partnerPlan = partner.plans[monthIndex];

    if (primaryCashOffset !== 0) {
      primaryPlan.cashBeforePurchase += primaryCashOffset;
      primaryPlan.monthEndCash += primaryCashOffset;
    }

    if (partnerCashOffset !== 0) {
      partnerPlan.cashBeforePurchase += partnerCashOffset;
      partnerPlan.monthEndCash += partnerCashOffset;
    }

    if (activeCollabBooths.length > 0) {
      let primaryCollabIncome = 0;
      let partnerCollabIncome = 0;

      for (const boothShare of activeCollabBooths) {
        primaryCollabIncome += boothShare.monthlyRevenue * boothShare.primaryShare;
        partnerCollabIncome += boothShare.monthlyRevenue * boothShare.partnerShare;
      }

      if (primaryCollabIncome > 0) {
        primaryPlan.monthlyBoothIncome += primaryCollabIncome;
        primaryPlan.monthlyBoothIncomePatungan += primaryCollabIncome;
        primaryPlan.monthlyIncome += primaryCollabIncome;
        primaryPlan.totalBoothsEquivalent =
          primary.revenuePerBooth > 0 ? primaryPlan.monthlyIncome / primary.revenuePerBooth : 0;
        primaryPlan.monthEndCash += primaryCollabIncome;
      }

      if (partnerCollabIncome > 0) {
        partnerPlan.monthlyBoothIncome += partnerCollabIncome;
        partnerPlan.monthlyBoothIncomePatungan += partnerCollabIncome;
        partnerPlan.monthlyIncome += partnerCollabIncome;
        partnerPlan.totalBoothsEquivalent =
          partner.revenuePerBooth > 0 ? partnerPlan.monthlyIncome / partner.revenuePerBooth : 0;
        partnerPlan.monthEndCash += partnerCollabIncome;
      }
    }

    if (monthIndex > 0) {
      const primaryPrevCash = primary.plans[monthIndex - 1].monthEndCash;
      const partnerPrevCash = partner.plans[monthIndex - 1].monthEndCash;
      const requiredCapital = collabBoothPrice;
      const combinedAvailable = primaryPrevCash + partnerPrevCash;

      if (requiredCapital > 0 && combinedAvailable >= requiredCapital) {
        const primaryWeight = combinedAvailable > 0 ? primaryPrevCash / combinedAvailable : 0.5;
        let primaryContribution = Math.max(0, Math.min(primaryPrevCash, requiredCapital * primaryWeight));
        let partnerContribution = Math.max(0, requiredCapital - primaryContribution);

        if (partnerContribution > partnerPrevCash) {
          const shortage = partnerContribution - partnerPrevCash;
          partnerContribution = partnerPrevCash;
          primaryContribution = Math.min(primaryPrevCash, primaryContribution + shortage);
        }

        if (primaryContribution > primaryPrevCash) {
          const shortage = primaryContribution - primaryPrevCash;
          primaryContribution = primaryPrevCash;
          partnerContribution = Math.min(partnerPrevCash, partnerContribution + shortage);
        }

        const partnerDominant = partnerPrevCash > primaryPrevCash;
        const ownerLabel = ownerIsPrimary ? "primary" : "partner";
        const primaryShare = requiredCapital > 0 ? primaryContribution / requiredCapital : 0;
        const partnerShare = requiredCapital > 0 ? partnerContribution / requiredCapital : 0;
        const primarySharePct = (primaryShare * 100).toFixed(1);
        const partnerSharePct = (partnerShare * 100).toFixed(1);

        const collabLabel =
          `Patungan disetujui (booth termurah: ${ownerLabel}): primary Rp ${formatGroupedNumber(primaryContribution)}, ` +
          `partner Rp ${formatGroupedNumber(partnerContribution)} | sharing primary ${primarySharePct}%, partner ${partnerSharePct}%` +
          (partnerDominant ? " (partner share lebih besar)" : "");

        primaryPlan.contractEvents.push({
          day: primaryPlan.purchaseDay,
          amount: 0,
          label: collabLabel,
          type: "partner_suggestion_with_purchase",
        });

        partnerPlan.contractEvents.push({
          day: partnerPlan.purchaseDay,
          amount: 0,
          label: collabLabel,
          type: "partner_suggestion_with_purchase",
        });

        // Collaborative purchase is assigned to user with the cheapest booth base price.
        if (ownerIsPrimary) {
          primaryPlan.boothsAdded += 1;
        } else {
          partnerPlan.boothsAdded += 1;
        }
        primaryPlan.unitTotalOwned += primaryShare;
        partnerPlan.unitTotalOwned += partnerShare;
        primaryCashOffset -= primaryContribution;
        partnerCashOffset -= partnerContribution;
        primaryPlan.monthEndCash -= primaryContribution;
        partnerPlan.monthEndCash -= partnerContribution;

        // New collaborative booth contributes recurring income from next month,
        // split by each user's capital sharing percentage.
        pendingCollabBooths.push({
          primaryShare,
          partnerShare,
          monthlyRevenue: collabRevenuePerBooth,
        });
      }
    }

    if (pendingCollabBooths.length > 0) {
      activeCollabBooths.push(...pendingCollabBooths);
      pendingCollabBooths.length = 0;
    }
  }

  const primaryLatest = primary.plans[primary.plans.length - 1];
  const partnerLatest = partner.plans[partner.plans.length - 1];
  primary.projectedMonthlyIncome = primaryLatest?.monthlyIncome ?? primary.projectedMonthlyIncome;
  partner.projectedMonthlyIncome = partnerLatest?.monthlyIncome ?? partner.projectedMonthlyIncome;

  const totalProjectedIncome =
    primary.projectedMonthlyIncome + partner.projectedMonthlyIncome;
  const totalBoothEquivalent =
    (primaryLatest?.totalBoothsEquivalent ?? primary.boothEquivalentOwned) +
    (partnerLatest?.totalBoothsEquivalent ?? partner.boothEquivalentOwned);

  return {
    targetDate: input.targetDate,
    primary,
    partner,
    combined: {
      totalProjectedIncome,
      totalBoothEquivalent,
    },
  };
}

export async function simulateSingleUserGrowth(input: {
  targetDate: Date;
  startDate: Date;
  email: string;
  openingBalance?: number;
  scenarioOptions?: SimulationScenarioOptions;
}) {
  const scenarioOptions: SimulationScenarioOptions = {
    includeExtraBoothCommission: input.scenarioOptions?.includeExtraBoothCommission ?? false,
    includeExtraCashierPartners: input.scenarioOptions?.includeExtraCashierPartners ?? false,
    includeExtraFreelance: input.scenarioOptions?.includeExtraFreelance ?? false,
  };

  const primary = await simulateUserBoothPlan({
    targetDate: input.targetDate,
    startDate: input.startDate,
    simUser: {
      email: input.email,
      fallbackBoothPrice: 7_500_000,
      fallbackExpenseMin: 1_000_000,
      fallbackExpenseMax: 1_000_000,
      fallbackOpeningBalance: input.openingBalance ?? 0,
      fallbackPurchaseTiming: BoothPurchaseTiming.START_OF_MONTH,
      revenuePerBooth: 1_000_000,
    },
    scenarioOptions,
  });

  return {
    targetDate: input.targetDate,
    primary,
    combined: {
      totalProjectedIncome: primary.projectedMonthlyIncome,
      totalBoothEquivalent: primary.boothEquivalentOwned,
    },
  };
}

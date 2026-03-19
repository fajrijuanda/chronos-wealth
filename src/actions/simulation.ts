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
  | "pt2_contribution";

type ContractEvent = {
  day: number;
  amount: number;
  label: string;
  type: ContractEventType;
};

function clampDay(day: number, min: number, max: number) {
  return Math.max(min, Math.min(max, day));
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

function getBoothPayoutDay(packageType: BoothPackageType, mouSignedAt: Date, daysInMonth: number) {
  const baseDay = getDate(mouSignedAt);
  const offset = packageType === BoothPackageType.EXCLUSIVE ? 0 : 1;
  return clampDay(baseDay + offset, 1, daysInMonth);
}

function getBoothCommissionDay(mouSignedAt: Date, daysInMonth: number) {
  const baseDay = getDate(mouSignedAt);
  return clampDay(baseDay + 3, 1, daysInMonth);
}

function getContractEventType(label: string): ContractEventType | null {
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

  if (/pt 2 urunan|pt2 urunan/i.test(label)) {
    return "pt2_contribution";
  }

  return null;
}

function getActiveSharePct(
  booth: {
    packageType: BoothPackageType;
    mouSignedAt: Date;
    economyProfitSharePct: number;
    exclusivePhase2StartsAfterMonths: number;
    exclusiveSharePhase1Pct: number;
    exclusiveSharePhase2Pct: number;
  },
  monthDate: Date,
) {
  const monthsSinceMou = differenceInMonths(
    startOfMonth(monthDate),
    startOfMonth(booth.mouSignedAt),
  );

  if (monthsSinceMou < 0) {
    return 0;
  }

  if (booth.packageType === BoothPackageType.ECONOMY) {
    return booth.economyProfitSharePct;
  }

  return monthsSinceMou >= booth.exclusivePhase2StartsAfterMonths
    ? booth.exclusiveSharePhase2Pct
    : booth.exclusiveSharePhase1Pct;
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

  const [financeProfile, incomeSources, target, ownerships] = await Promise.all([
    prisma.userFinanceProfile.findUnique({ where: { userId: user.id } }),
    getIncomeSourcesByUserId(user.id),
    prisma.userBoothTarget.findUnique({ where: { userId: user.id } }),
    prisma.boothOwnership.findMany({
      where: { userId: user.id },
      include: { booth: true },
    }),
  ]);

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
  const monthlyExpense =
    ((financeProfile?.monthlyExpenseMin ?? input.simUser.fallbackExpenseMin) +
      (financeProfile?.monthlyExpenseMax ?? input.simUser.fallbackExpenseMax)) /
    2;

  const purchaseTiming =
    financeProfile?.purchaseTiming ?? input.simUser.fallbackPurchaseTiming;

  const existingEquivalent = ownerships.reduce((acc, ownership) => {
    const sharePct = getActiveSharePct(ownership.booth, new Date());
    const monthlyShare =
      ownership.booth.expectedMonthlyIncome *
      ownership.booth.boothUnitCount *
      (sharePct / 100) *
      (ownership.revenueSharePct / 100);
    return acc + monthlyShare / revenuePerBooth;
  }, 0);

  let boothEquivalentOwned = existingEquivalent;
  let simulatedEquivalentAdded = 0;
  let holdingFundAccumulated = 0;
  let pt2FundAccumulated = 0;

  const idleCashTarget = financeProfile?.idleCashTarget ?? 1_000_000_000;
  const holdingCapitalTarget = financeProfile?.holdingCapitalTarget ?? 1_500_000_000;
  const holdingContributionPct = financeProfile?.holdingContributionPct ?? 50;
  const holdingLaunchDate = financeProfile?.holdingLaunchDate ?? new Date("2028-07-01");
  const pt2BuildCapitalTarget = financeProfile?.pt2BuildCapitalTarget ?? 8_000_000_000;
  const pt2ContributionPct = financeProfile?.pt2ContributionPct ?? 50;
  const pt2LaunchDate = financeProfile?.pt2LaunchDate ?? new Date("2030-01-01");
  const renewEconomyBoothContracts = financeProfile?.renewEconomyBoothContracts ?? true;
  const renewExclusiveBoothContracts =
    financeProfile?.renewExclusiveBoothContracts ?? true;

  const exclusiveExtraUnitsByOwnershipId = new Map<string, number>();

  const personalHoldingTarget =
    holdingCapitalTarget * (holdingContributionPct / 100);
  const personalPt2Target =
    pt2BuildCapitalTarget * (pt2ContributionPct / 100);

  const plans: Array<{
    month: string;
    purchaseDay: number;
    cashBeforePurchase: number;
    monthlyIncome: number;
    monthlyExpense: number;
    monthlyHoldingSaved: number;
    monthlyPt2Saved: number;
    reserveGuard: number;
    monthlyBoothIncome: number;
    monthlyCommissionIncome: number;
    boothsAdded: number;
    totalBoothsEquivalent: number;
    monthEndCash: number;
    contractEvents: ContractEvent[];
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

    const events: DatedEvent[] = [];

    for (const income of incomeSources) {
      if (
        income.category === CategoryType.STOCK &&
        startOfMonth(monthDate) < startOfMonth(holdingLaunchDate)
      ) {
        continue;
      }

      if (income.isRecurring) {
        events.push({
          day: clampDay(income.payoutDate ?? 1, 1, daysInMonth),
          amount: income.amount,
          label: income.name,
        });
        continue;
      }

      if (income.expectedDate && monthKey(income.expectedDate) === monthKey(monthDate)) {
        events.push({
          day: clampDay(getDate(income.expectedDate), 1, daysInMonth),
          amount: income.amount,
          label: income.name,
        });
      }
    }

    let monthlyBoothIncome = 0;
    let monthlyCommissionIncome = 0;
    let activeEquivalentFromOwned = 0;

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
        daysInMonth,
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

      if (boothActiveInMonth) {
        const activeSharePct = getActiveSharePct(booth, monthDate);
        const extraUnits = exclusiveExtraUnitsByOwnershipId.get(ownership.id) ?? 0;
        const effectiveUnits = booth.boothUnitCount + extraUnits;
        const incomeAmount =
          booth.expectedMonthlyIncome *
          effectiveUnits *
          (activeSharePct / 100) *
          (ownership.revenueSharePct / 100);

        events.push({
          day: payoutDay,
          amount: incomeAmount,
          label: `${booth.name} payout`,
        });

        activeEquivalentFromOwned += incomeAmount / revenuePerBooth;
        monthlyBoothIncome += incomeAmount;
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

    events.sort((a, b) => a.day - b.day);

    const incomeBeforePurchase = events
      .filter((event) => event.day <= purchaseDay)
      .reduce((acc, event) => acc + event.amount, 0);

    const totalMonthEventsIncome = events.reduce((acc, event) => acc + event.amount, 0);
    let contractEvents = events
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

    const launchMonthDiff = differenceInMonths(
      startOfMonth(holdingLaunchDate),
      startOfMonth(monthDate),
    );

    const shouldAllocateHolding =
      launchMonthDiff >= 0 && holdingFundAccumulated < personalHoldingTarget;
    const remainingMonthsForHolding = shouldAllocateHolding ? launchMonthDiff + 1 : 0;
    const remainingHoldingNeed = Math.max(0, personalHoldingTarget - holdingFundAccumulated);

    const plannedHoldingAllocation =
      remainingMonthsForHolding > 0
        ? remainingHoldingNeed / remainingMonthsForHolding
        : 0;

    const pt2LaunchMonthDiff = differenceInMonths(
      startOfMonth(pt2LaunchDate),
      startOfMonth(monthDate),
    );

    const shouldAllocatePt2 =
      pt2LaunchMonthDiff >= 0 && pt2FundAccumulated < personalPt2Target;
    const remainingMonthsForPt2 = shouldAllocatePt2 ? pt2LaunchMonthDiff + 1 : 0;
    const remainingPt2Need = Math.max(0, personalPt2Target - pt2FundAccumulated);

    const plannedPt2Allocation =
      remainingMonthsForPt2 > 0
        ? remainingPt2Need / remainingMonthsForPt2
        : 0;

    cash += incomeBeforePurchase;
    const cashBeforePurchase = cash;

    const reserveGuard = idleCashTarget;
    const safeCashForBooth = Math.max(
      0,
      cashBeforePurchase - monthlyExpense - reserveGuard - plannedHoldingAllocation - plannedPt2Allocation,
    );
    const remainingBoothNeed = Math.max(
      0,
      targetBoothEquivalent > 0 ? targetBoothEquivalent - boothEquivalentOwned : Number.POSITIVE_INFINITY,
    );
    const maxBoothByCash = boothPrice > 0 ? Math.floor(safeCashForBooth / boothPrice) : 0;
    const boothsAdded =
      targetBoothEquivalent > 0
        ? Math.min(maxBoothByCash, Math.floor(remainingBoothNeed))
        : maxBoothByCash;
    const capitalUsed = boothsAdded * boothPrice;

    cash -= capitalUsed;

    const actualHoldingSaved = Math.min(
      plannedHoldingAllocation,
      Math.max(0, cash - monthlyExpense - reserveGuard),
    );

    cash -= actualHoldingSaved;
    holdingFundAccumulated += actualHoldingSaved;

    const actualPt2Saved = Math.min(
      plannedPt2Allocation,
      Math.max(0, cash - monthlyExpense - reserveGuard),
    );

    cash -= actualPt2Saved;
    pt2FundAccumulated += actualPt2Saved;

    if (actualPt2Saved > 0) {
      contractEvents = [
        ...contractEvents,
        {
          day: purchaseDay,
          amount: -actualPt2Saved,
          label: "PT 2 urunan contribution",
          type: "pt2_contribution",
        },
      ];
    }

    cash += incomeAfterPurchase;
    cash -= monthlyExpense;

    simulatedEquivalentAdded += boothsAdded;
    boothEquivalentOwned = activeEquivalentFromOwned + simulatedEquivalentAdded;

    plans.push({
      month: format(monthDate, "MMM yyyy"),
      purchaseDay,
      cashBeforePurchase,
      monthlyIncome: totalMonthEventsIncome,
      monthlyExpense,
      monthlyHoldingSaved: actualHoldingSaved,
      monthlyPt2Saved: actualPt2Saved,
      reserveGuard,
      monthlyBoothIncome,
      monthlyCommissionIncome,
      boothsAdded,
      totalBoothsEquivalent: boothEquivalentOwned,
      monthEndCash: cash,
      contractEvents,
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
    idleCashTarget,
    holdingFundAccumulated,
    personalHoldingTarget,
    holdingLaunchDate,
    pt2FundAccumulated,
    personalPt2Target,
    pt2LaunchDate,
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

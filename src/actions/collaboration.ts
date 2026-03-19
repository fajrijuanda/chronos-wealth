"use server";

import {
  AppUser,
  BoothPurchaseTiming,
  BoothSelectionType,
  FriendshipStatus,
  ProposalStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type CreateJointBoothProposalInput = {
  requesterId: string;
  partnerId: string;
  boothName: string;
  requesterCapital: number;
  partnerCapital: number;
  expectedMonthlyIncome: number;
  selectedBoothType: BoothSelectionType;
  notes?: string;
};

function ensurePositive(value: number, fieldName: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
}

function formatDisplayNameFromEmail(email: string) {
  const base = email.split("@")[0] ?? "User";
  return base
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function ensureAppUserByEmail(input: {
  email: string;
  displayName?: string;
  boothBasePrice?: number;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    throw new Error("A valid user email is required");
  }

  const boothBasePrice = input.boothBasePrice ?? 7_500_000;
  ensurePositive(boothBasePrice, "boothBasePrice");

  const result = await prisma.appUser.upsert({
    where: { email },
    update: {
      displayName: input.displayName ?? formatDisplayNameFromEmail(email),
      boothBasePrice,
    },
    create: {
      email,
      displayName: input.displayName ?? formatDisplayNameFromEmail(email),
      boothBasePrice,
    },
  });

  return result;
}

export async function getAppUserByEmail(email: string) {
  return prisma.appUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
}

async function requireUserByEmail(email: string): Promise<AppUser> {
  const user = await getAppUserByEmail(email);
  if (!user) {
    throw new Error(`User with email ${email} not found`);
  }
  return user;
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  if (requesterId === addresseeId) {
    throw new Error("You cannot add yourself as a friend");
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
  });

  if (existing) {
    return existing;
  }

  const result = await prisma.friendship.create({
    data: {
      requesterId,
      addresseeId,
      status: FriendshipStatus.PENDING,
    },
  });

  revalidatePath("/income");
  return result;
}

export async function respondFriendRequest(
  friendshipId: string,
  action: "accept" | "reject",
) {
  const status =
    action === "accept" ? FriendshipStatus.ACCEPTED : FriendshipStatus.REJECTED;

  const result = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status },
  });

  revalidatePath("/income");
  return result;
}

export async function createJointBoothProposal(
  input: CreateJointBoothProposalInput,
) {
  ensurePositive(input.requesterCapital, "requesterCapital");
  ensurePositive(input.partnerCapital, "partnerCapital");
  ensurePositive(input.expectedMonthlyIncome, "expectedMonthlyIncome");

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: FriendshipStatus.ACCEPTED,
      OR: [
        { requesterId: input.requesterId, addresseeId: input.partnerId },
        { requesterId: input.partnerId, addresseeId: input.requesterId },
      ],
    },
  });

  if (!friendship) {
    throw new Error("Collaboration requires an accepted friendship");
  }

  const proposal = await prisma.jointBoothProposal.create({
    data: {
      requesterId: input.requesterId,
      partnerId: input.partnerId,
      boothName: input.boothName,
      requesterCapital: input.requesterCapital,
      partnerCapital: input.partnerCapital,
      expectedMonthlyIncome: input.expectedMonthlyIncome,
      selectedBoothType: input.selectedBoothType,
      notes: input.notes,
      status: ProposalStatus.PENDING,
    },
    include: {
      requester: true,
      partner: true,
    },
  });

  revalidatePath("/income");
  return proposal;
}

export async function decideBoothPurchaseStrategy(input: {
  requesterId: string;
  partnerId: string;
  boothName: string;
  boothPrice: number;
  requesterAvailableBalance: number;
  partnerBoothPrice: number;
  expectedMonthlyIncome: number;
  selectedBoothType: BoothSelectionType;
  notes?: string;
}) {
  ensurePositive(input.boothPrice, "boothPrice");
  ensurePositive(input.partnerBoothPrice, "partnerBoothPrice");

  if (input.requesterAvailableBalance >= input.boothPrice) {
    const booth = await prisma.$transaction(async (tx) => {
      const createdBooth = await tx.booth.create({
        data: {
          name: input.boothName,
          expectedMonthlyIncome: input.expectedMonthlyIncome,
          isShared: false,
        },
      });

      await tx.boothOwnership.create({
        data: {
          boothId: createdBooth.id,
          userId: input.requesterId,
          capitalAmount: input.boothPrice,
          revenueSharePct: 100,
        },
      });

      return createdBooth;
    });

    revalidatePath("/income");
    revalidatePath("/targets");

    return {
      mode: "SELF_PURCHASE" as const,
      booth,
      message: "Balance is sufficient, booth was created as fully owned",
    };
  }

  const requesterCapital = Math.max(input.requesterAvailableBalance, 0);
  const fallbackPartnerCapital = Math.max(
    input.boothPrice - requesterCapital,
    input.partnerBoothPrice,
  );

  const proposal = await createJointBoothProposal({
    requesterId: input.requesterId,
    partnerId: input.partnerId,
    boothName: input.boothName,
    requesterCapital,
    partnerCapital: fallbackPartnerCapital,
    expectedMonthlyIncome: input.expectedMonthlyIncome,
    selectedBoothType: input.selectedBoothType,
    notes: input.notes,
  });

  return {
    mode: "COLLAB_PROPOSAL" as const,
    proposal,
    message: "Balance is insufficient, collaboration proposal has been sent",
  };
}

export async function reviewJointBoothProposal(input: {
  proposalId: string;
  reviewerUserId: string;
  approve: boolean;
  reviewerNote?: string;
}) {
  const proposal = await prisma.jointBoothProposal.findUnique({
    where: { id: input.proposalId },
  });

  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.status !== ProposalStatus.PENDING) {
    throw new Error("Proposal already reviewed");
  }

  if (proposal.partnerId !== input.reviewerUserId) {
    throw new Error("Only the invited partner can review this proposal");
  }

  if (!input.approve) {
    const rejected = await prisma.jointBoothProposal.update({
      where: { id: input.proposalId },
      data: {
        status: ProposalStatus.REJECTED,
        reviewedAt: new Date(),
        reviewerNote: input.reviewerNote,
      },
    });
    revalidatePath("/income");
    return rejected;
  }

  const totalCapital = proposal.requesterCapital + proposal.partnerCapital;
  const requesterSharePct = (proposal.requesterCapital / totalCapital) * 100;
  const partnerSharePct = (proposal.partnerCapital / totalCapital) * 100;

  const approvedProposal = await prisma.$transaction(async (tx) => {
    const booth = await tx.booth.create({
      data: {
        name: proposal.boothName,
        expectedMonthlyIncome: proposal.expectedMonthlyIncome,
        isShared: true,
      },
    });

    await tx.boothOwnership.createMany({
      data: [
        {
          boothId: booth.id,
          userId: proposal.requesterId,
          capitalAmount: proposal.requesterCapital,
          revenueSharePct: requesterSharePct,
        },
        {
          boothId: booth.id,
          userId: proposal.partnerId,
          capitalAmount: proposal.partnerCapital,
          revenueSharePct: partnerSharePct,
        },
      ],
    });

    return tx.jointBoothProposal.update({
      where: { id: proposal.id },
      data: {
        status: ProposalStatus.APPROVED,
        reviewedAt: new Date(),
        reviewerNote: input.reviewerNote,
        createdBoothId: booth.id,
      },
      include: {
        createdBooth: true,
      },
    });
  });

  revalidatePath("/income");
  revalidatePath("/targets");
  return approvedProposal;
}

export async function upsertUserBoothTarget(data: {
  userId: string;
  targetBoothEquivalent: number;
  revenuePerBooth?: number;
}) {
  if (!Number.isInteger(data.targetBoothEquivalent) || data.targetBoothEquivalent <= 0) {
    throw new Error("targetBoothEquivalent must be a positive integer");
  }

  const revenuePerBooth = data.revenuePerBooth ?? 1_000_000;
  ensurePositive(revenuePerBooth, "revenuePerBooth");

  const result = await prisma.userBoothTarget.upsert({
    where: { userId: data.userId },
    update: {
      targetBoothEquivalent: data.targetBoothEquivalent,
      revenuePerBooth,
    },
    create: {
      userId: data.userId,
      targetBoothEquivalent: data.targetBoothEquivalent,
      revenuePerBooth,
    },
  });

  revalidatePath("/targets");
  return result;
}

export async function getUserBoothTargetProgress(userId: string) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [target, ownerships] = await Promise.all([
    prisma.userBoothTarget.findUnique({ where: { userId } }),
    prisma.boothOwnership.findMany({
      where: { userId },
      include: {
        booth: {
          include: {
            monthlySales: {
              where: { month, year },
              take: 1,
            },
          },
        },
      },
    }),
  ]);

  if (!target) {
    return {
      hasTarget: false,
      targetBoothEquivalent: 0,
      revenuePerBooth: 1_000_000,
      targetIncome: 0,
      monthlyIncomeShare: 0,
      boothEquivalentAchieved: 0,
      progressPct: 0,
    };
  }

  const monthlyIncomeShare = ownerships.reduce((acc: number, ownership) => {
    const sale = ownership.booth.monthlySales[0];
    const baseline = sale?.netIncome ?? sale?.grossIncome ?? ownership.booth.expectedMonthlyIncome;
    const incomeShare = baseline * (ownership.revenueSharePct / 100);
    return acc + incomeShare;
  }, 0);

  const targetIncome = target.targetBoothEquivalent * target.revenuePerBooth;
  const boothEquivalentAchieved = monthlyIncomeShare / target.revenuePerBooth;
  const progressPct = targetIncome === 0 ? 0 : (monthlyIncomeShare / targetIncome) * 100;

  return {
    hasTarget: true,
    targetBoothEquivalent: target.targetBoothEquivalent,
    revenuePerBooth: target.revenuePerBooth,
    targetIncome,
    monthlyIncomeShare,
    boothEquivalentAchieved,
    progressPct,
  };
}

export async function getUserBoothPortfolio(userId: string) {
  const ownerships = await prisma.boothOwnership.findMany({
    where: { userId },
    include: {
      booth: true,
    },
    orderBy: {
      booth: {
        createdAt: "desc",
      },
    },
  });

  return ownerships.map((ownership) => ({
    boothId: ownership.boothId,
    boothName: ownership.booth.name,
    expectedMonthlyIncome: ownership.booth.expectedMonthlyIncome,
    revenueSharePct: ownership.revenueSharePct,
    capitalAmount: ownership.capitalAmount,
    isShared: ownership.booth.isShared,
  }));
}

export async function upsertUserFinanceProfile(data: {
  userId: string;
  monthlyExpenseMin: number;
  monthlyExpenseMax: number;
  purchaseTiming: BoothPurchaseTiming;
  purchaseDayOverride?: number | null;
  openingBalance?: number;
}) {
  if (data.monthlyExpenseMin < 0 || data.monthlyExpenseMax < 0) {
    throw new Error("Monthly expense values must be zero or positive");
  }

  if (data.monthlyExpenseMax < data.monthlyExpenseMin) {
    throw new Error("monthlyExpenseMax cannot be lower than monthlyExpenseMin");
  }

  if (
    data.purchaseDayOverride !== undefined &&
    data.purchaseDayOverride !== null &&
    (data.purchaseDayOverride < 1 || data.purchaseDayOverride > 31)
  ) {
    throw new Error("purchaseDayOverride must be between 1 and 31");
  }

  const result = await prisma.userFinanceProfile.upsert({
    where: { userId: data.userId },
    update: {
      monthlyExpenseMin: data.monthlyExpenseMin,
      monthlyExpenseMax: data.monthlyExpenseMax,
      purchaseTiming: data.purchaseTiming,
      purchaseDayOverride: data.purchaseDayOverride ?? null,
      openingBalance: data.openingBalance ?? 0,
    },
    create: {
      userId: data.userId,
      monthlyExpenseMin: data.monthlyExpenseMin,
      monthlyExpenseMax: data.monthlyExpenseMax,
      purchaseTiming: data.purchaseTiming,
      purchaseDayOverride: data.purchaseDayOverride ?? null,
      openingBalance: data.openingBalance ?? 0,
    },
  });

  revalidatePath("/simulation");
  revalidatePath("/collaboration");

  return result;
}

export async function getCollaborationWorkspace(email: string) {
  const currentUser = await ensureAppUserByEmail({ email });

  const [friendships, incomingProposals, outgoingProposals, portfolio, targetProgress, financeProfile] =
    await Promise.all([
      prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: currentUser.id },
            { addresseeId: currentUser.id },
          ],
        },
        include: {
          requester: true,
          addressee: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.jointBoothProposal.findMany({
        where: { partnerId: currentUser.id },
        include: {
          requester: true,
          partner: true,
          createdBooth: true,
        },
        orderBy: { proposedAt: "desc" },
      }),
      prisma.jointBoothProposal.findMany({
        where: { requesterId: currentUser.id },
        include: {
          requester: true,
          partner: true,
          createdBooth: true,
        },
        orderBy: { proposedAt: "desc" },
      }),
      getUserBoothPortfolio(currentUser.id),
      getUserBoothTargetProgress(currentUser.id),
      prisma.userFinanceProfile.findUnique({ where: { userId: currentUser.id } }),
    ]);

  const normalizedFriendships = friendships.map((friendship) => {
    const friend =
      friendship.requesterId === currentUser.id
        ? friendship.addressee
        : friendship.requester;

    return {
      id: friendship.id,
      status: friendship.status,
      friend,
      requestedByMe: friendship.requesterId === currentUser.id,
      canRespond:
        friendship.addresseeId === currentUser.id &&
        friendship.status === FriendshipStatus.PENDING,
    };
  });

  return {
    currentUser,
    friendships: normalizedFriendships,
    incomingProposals,
    outgoingProposals,
    portfolio,
    targetProgress,
    financeProfile,
  };
}

export async function sendFriendRequestByEmail(input: {
  requesterEmail: string;
  addresseeEmail: string;
  addresseeBoothBasePrice?: number;
}) {
  const requester = await ensureAppUserByEmail({ email: input.requesterEmail });
  const addressee = await ensureAppUserByEmail({
    email: input.addresseeEmail,
    boothBasePrice: input.addresseeBoothBasePrice,
  });

  return sendFriendRequest(requester.id, addressee.id);
}

export async function createJointBoothProposalByEmail(input: {
  requesterEmail: string;
  partnerEmail: string;
  boothName: string;
  boothPrice: number;
  requesterAvailableBalance: number;
  partnerBoothPrice: number;
  expectedMonthlyIncome: number;
  selectedBoothType: BoothSelectionType;
  notes?: string;
}) {
  const requester = await requireUserByEmail(input.requesterEmail);
  const partner = await ensureAppUserByEmail({
    email: input.partnerEmail,
    boothBasePrice: input.partnerBoothPrice,
  });

  return decideBoothPurchaseStrategy({
    requesterId: requester.id,
    partnerId: partner.id,
    boothName: input.boothName,
    boothPrice: input.boothPrice,
    requesterAvailableBalance: input.requesterAvailableBalance,
    partnerBoothPrice: input.partnerBoothPrice,
    expectedMonthlyIncome: input.expectedMonthlyIncome,
    selectedBoothType: input.selectedBoothType,
    notes: input.notes,
  });
}

export async function setUserTargetByEmail(input: {
  email: string;
  targetBoothEquivalent: number;
  revenuePerBooth?: number;
}) {
  const user = await ensureAppUserByEmail({ email: input.email });
  return upsertUserBoothTarget({
    userId: user.id,
    targetBoothEquivalent: input.targetBoothEquivalent,
    revenuePerBooth: input.revenuePerBooth,
  });
}

export async function setUserFinanceProfileByEmail(input: {
  email: string;
  monthlyExpenseMin: number;
  monthlyExpenseMax: number;
  purchaseTiming: BoothPurchaseTiming;
  purchaseDayOverride?: number | null;
  openingBalance?: number;
}) {
  const user = await ensureAppUserByEmail({ email: input.email });
  return upsertUserFinanceProfile({
    userId: user.id,
    monthlyExpenseMin: input.monthlyExpenseMin,
    monthlyExpenseMax: input.monthlyExpenseMax,
    purchaseTiming: input.purchaseTiming,
    purchaseDayOverride: input.purchaseDayOverride,
    openingBalance: input.openingBalance,
  });
}

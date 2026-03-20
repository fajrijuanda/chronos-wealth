"use server";

import {
  AppUser,
  AssetType,
  BoothPackageType,
  BoothPurchaseTiming,
  BoothSelectionType,
  CategoryType,
  FriendshipStatus,
  NotificationPriority,
  NotificationType,
  ProposalStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createUserNotification } from "@/actions/notification";

type CreateJointBoothProposalInput = {
  requesterId: string;
  partnerId: string;
  boothName: string;
  requesterCapital: number;
  partnerCapital: number;
  expectedMonthlyIncome: number;
  packageType?: BoothPackageType;
  mouSignedAt?: Date;
  referralEconomyBooths?: number;
  selectedBoothType: BoothSelectionType;
  notes?: string;
};

function ensurePositive(value: number, fieldName: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
}

function computeBoothRecurringPayoutDay(mouSignedAt: Date, packageType: BoothPackageType) {
  const mouDay = mouSignedAt.getDate();
  if (packageType === BoothPackageType.EXCLUSIVE) {
    return mouDay;
  }

  const nextDay = mouDay + 1;
  return nextDay > 31 ? 1 : nextDay;
}

function decodeBase64ToBytes(base64: string): Uint8Array {
  const source = Buffer.from(base64, "base64");
  const bytes: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(source.length));
  bytes.set(source);
  return bytes;
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

  // Build the update object dynamically to only update what's provided
  const updateData: { displayName?: string; boothBasePrice?: number } = {};
  if (input.displayName) updateData.displayName = input.displayName;
  if (input.boothBasePrice !== undefined) updateData.boothBasePrice = input.boothBasePrice;

  const result = await prisma.appUser.upsert({
    where: { email },
    update: updateData,
    create: {
      email,
      displayName: input.displayName ?? formatDisplayNameFromEmail(email),
      boothBasePrice: input.boothBasePrice ?? 0,
    },
  });

  return result;
}

export async function getAppUserByEmail(email: string) {
  return prisma.appUser.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
}

export async function updateUserProfileByEmail(input: {
  email: string;
  displayName: string;
  profilePhotoUrl?: string | null;
  bio?: string | null;
}) {
  const user = await requireUserByEmail(input.email);
  const displayName = input.displayName.trim();

  if (!displayName) {
    throw new Error("Display name is required");
  }

  const result = await prisma.appUser.update({
    where: { id: user.id },
    data: {
      displayName,
      profilePhotoUrl: input.profilePhotoUrl?.trim() || null,
      bio: input.bio?.trim() || null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/collaboration");
  revalidatePath("/simulation");

  return result;
}

export async function getUserConnectionDirectoryByEmail(email: string) {
  const currentUser = await ensureAppUserByEmail({ email });

  const [users, friendships] = await Promise.all([
    prisma.appUser.findMany({
      where: { id: { not: currentUser.id } },
      orderBy: { displayName: "asc" },
    }),
    prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: currentUser.id },
          { addresseeId: currentUser.id },
        ],
      },
    }),
  ]);

  const friendshipByUserId = new Map<string, (typeof friendships)[number]>();

  for (const friendship of friendships) {
    const otherUserId =
      friendship.requesterId === currentUser.id
        ? friendship.addresseeId
        : friendship.requesterId;
    friendshipByUserId.set(otherUserId, friendship);
  }

  const directory = users.map((user) => {
    const friendship = friendshipByUserId.get(user.id);

    if (!friendship) {
      return {
        user,
        relationship: "NONE" as const,
        friendshipId: null,
      };
    }

    const isOutgoing = friendship.requesterId === currentUser.id;

    if (friendship.status === FriendshipStatus.PENDING) {
      return {
        user,
        relationship: isOutgoing ? ("PENDING_OUT" as const) : ("PENDING_IN" as const),
        friendshipId: friendship.id,
      };
    }

    return {
      user,
      relationship: friendship.status,
      friendshipId: friendship.id,
    };
  });

  return {
    currentUser,
    directory,
  };
}

export async function setManualBasePrice(email: string, price: number) {
  if (price < 0) throw new Error("Price must be at least 0");
  
  const user = await getAppUserByEmail(email);
  if (!user) throw new Error("User not found");

  const updated = await prisma.appUser.update({
    where: { email: user.email },
    data: { boothBasePrice: price },
  });

  revalidatePath("/assets");
  revalidatePath("/simulation");
  return updated;
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

  const requester = await prisma.appUser.findUnique({ where: { id: requesterId } });
  if (requester) {
    await createUserNotification({
      userId: addresseeId,
      type: NotificationType.SOCIAL,
      priority: NotificationPriority.MEDIUM,
      title: "Permintaan koneksi baru",
      body: `${requester.displayName} mengirimkan permintaan koneksi kepada Anda.`,
      href: "/profile?tab=connections",
      metadata: { requesterEmail: requester.email, friendshipId: result.id },
    });
  }

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
    include: {
      requester: true,
      addressee: true,
    },
  });

  await createUserNotification({
    userId: result.requesterId,
    type: NotificationType.SOCIAL,
    priority: action === "accept" ? NotificationPriority.HIGH : NotificationPriority.LOW,
    title: action === "accept" ? "Permintaan koneksi diterima" : "Permintaan koneksi ditolak",
    body:
      action === "accept"
        ? `${result.addressee.displayName} menerima permintaan koneksi Anda.`
        : `${result.addressee.displayName} menolak permintaan koneksi Anda.`,
    href: "/profile?tab=connections",
    metadata: { friendshipId: result.id, action },
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
      packageType: input.packageType ?? BoothPackageType.ECONOMY,
      mouSignedAt: input.mouSignedAt ?? new Date(),
      referralEconomyBooths: input.referralEconomyBooths ?? 0,
      selectedBoothType: input.selectedBoothType,
      notes: input.notes,
      status: ProposalStatus.PENDING,
    },
    include: {
      requester: true,
      partner: true,
    },
  });

  await createUserNotification({
    userId: input.partnerId,
    type: NotificationType.COLLABORATION,
    priority: NotificationPriority.HIGH,
    title: "Proposal booth baru",
    body: `${proposal.requester.displayName} mengirim proposal untuk booth ${proposal.boothName}.`,
    href: "/collaboration",
    metadata: {
      proposalId: proposal.id,
      boothName: proposal.boothName,
      requesterEmail: proposal.requester.email,
    },
  });

  revalidatePath("/income");
  revalidatePath("/assets");
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
  packageType?: BoothPackageType;
  mouSignedAt?: Date;
  mouDocumentName?: string;
  mouDocumentMimeType?: string;
  mouDocumentBase64?: string;
  referralEconomyBooths?: number;
  selectedBoothType: BoothSelectionType;
  notes?: string;
}) {
  if (input.boothPrice < 0) throw new Error("boothPrice must be at least 0");
  if (input.partnerBoothPrice < 0) throw new Error("partnerBoothPrice must be at least 0");

  if (input.requesterAvailableBalance >= input.boothPrice) {
    const booth = await prisma.$transaction(async (tx) => {
      const isExclusive = (input.packageType ?? BoothPackageType.ECONOMY) === BoothPackageType.EXCLUSIVE;
      const packageType = input.packageType ?? BoothPackageType.ECONOMY;
      const mouSignedAt = input.mouSignedAt ?? new Date();
      const payoutDate = computeBoothRecurringPayoutDay(mouSignedAt, packageType);
      const existingBooth = await tx.booth.findUnique({ where: { name: input.boothName } });
      if (existingBooth) {
          throw new Error(`Booth with name "${input.boothName}" already exists in the system.`);
      }

      const mouDocumentName = input.mouDocumentName?.trim();
      const mouDocumentMimeType = input.mouDocumentMimeType?.trim();
      const mouDocumentData: Uint8Array<ArrayBuffer> | null = input.mouDocumentBase64
        ? (decodeBase64ToBytes(input.mouDocumentBase64) as Uint8Array<ArrayBuffer>)
        : null;

      const createdBooth = await tx.booth.create({
        data: {
          name: input.boothName,
          expectedMonthlyIncome: input.expectedMonthlyIncome,
          boothUnitCount: isExclusive ? 2 : 1,
          packageType,
          mouSignedAt,
          mouDocumentName: mouDocumentName || null,
          mouDocumentMimeType: mouDocumentMimeType || null,
          mouDocumentData,
          contractDurationMonths: isExclusive ? 48 : 24,
          exclusiveRenewalCapital: isExclusive ? 20_000_000 : 20_000_000,
          referralEconomyBooths: input.referralEconomyBooths ?? 0,
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

      await tx.incomeSource.create({
        data: {
          ownerUserId: input.requesterId,
          name: `${input.boothName} (Booth)`,
          category: CategoryType.BOOTH,
          amount: input.expectedMonthlyIncome,
          isRecurring: true,
          payoutDate,
          expectedDate: null,
          isActive: true,
        },
      });

      return createdBooth;
    });

    revalidatePath("/income");
    revalidatePath("/targets");
    revalidatePath("/assets");

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
    packageType: input.packageType,
    mouSignedAt: input.mouSignedAt,
    referralEconomyBooths: input.referralEconomyBooths,
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

    await createUserNotification({
      userId: proposal.requesterId,
      type: NotificationType.COLLABORATION,
      priority: NotificationPriority.MEDIUM,
      title: "Proposal booth ditolak",
      body: `Proposal ${proposal.boothName} ditolak oleh partner Anda.`,
      href: "/collaboration",
      metadata: { proposalId: proposal.id, status: "REJECTED" },
    });

    revalidatePath("/income");
    return rejected;
  }

  const totalCapital = proposal.requesterCapital + proposal.partnerCapital;
  const requesterSharePct = (proposal.requesterCapital / totalCapital) * 100;
  const partnerSharePct = (proposal.partnerCapital / totalCapital) * 100;
  const requesterIncomeAmount = proposal.expectedMonthlyIncome * (requesterSharePct / 100);
  const partnerIncomeAmount = proposal.expectedMonthlyIncome * (partnerSharePct / 100);
  const payoutDate = computeBoothRecurringPayoutDay(proposal.mouSignedAt, proposal.packageType);

  const approvedProposal = await prisma.$transaction(async (tx) => {
    const isExclusive = proposal.packageType === BoothPackageType.EXCLUSIVE;
    const booth = await tx.booth.create({
      data: {
        name: proposal.boothName,
        expectedMonthlyIncome: proposal.expectedMonthlyIncome,
        boothUnitCount: isExclusive ? 2 : 1,
        packageType: proposal.packageType,
        mouSignedAt: proposal.mouSignedAt,
        contractDurationMonths: isExclusive ? 48 : 24,
        exclusiveRenewalCapital: isExclusive ? 20_000_000 : 20_000_000,
        referralEconomyBooths: proposal.referralEconomyBooths,
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

    await tx.incomeSource.createMany({
      data: [
        {
          ownerUserId: proposal.requesterId,
          name: `${proposal.boothName} (Booth)`,
          category: CategoryType.BOOTH,
          amount: requesterIncomeAmount,
          isRecurring: true,
          payoutDate,
          expectedDate: null,
          isActive: true,
        },
        {
          ownerUserId: proposal.partnerId,
          name: `${proposal.boothName} (Booth)`,
          category: CategoryType.BOOTH,
          amount: partnerIncomeAmount,
          isRecurring: true,
          payoutDate,
          expectedDate: null,
          isActive: true,
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

  await createUserNotification({
    userId: proposal.requesterId,
    type: NotificationType.COLLABORATION,
    priority: NotificationPriority.HIGH,
    title: "Proposal booth disetujui",
    body: `Proposal ${proposal.boothName} telah disetujui dan booth sudah dibuat.`,
    href: "/assets",
    metadata: { proposalId: proposal.id, status: "APPROVED", boothName: proposal.boothName },
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
    ownershipId: ownership.id,
    boothId: ownership.boothId,
    boothName: ownership.booth.name,
    packageType: ownership.booth.packageType,
    expectedMonthlyIncome: ownership.booth.expectedMonthlyIncome,
    revenueSharePct: ownership.revenueSharePct,
    capitalAmount: ownership.capitalAmount,
    isShared: ownership.booth.isShared,
  }));
}

export async function createNonBoothAsset(input: {
  ownerUserId: string;
  type: AssetType;
  name: string;
  estimatedValue: number;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
  acquiredAt?: Date | null;
}) {
  if (!input.name.trim()) {
    throw new Error("Asset name is required");
  }

  if (!Number.isFinite(input.estimatedValue) || input.estimatedValue < 0) {
    throw new Error("estimatedValue must be zero or positive");
  }

  if (
    input.quantity !== undefined &&
    input.quantity !== null &&
    (!Number.isFinite(input.quantity) || input.quantity < 0)
  ) {
    throw new Error("quantity must be zero or positive");
  }

  const result = await prisma.userAsset.create({
    data: {
      ownerUserId: input.ownerUserId,
      type: input.type,
      name: input.name.trim(),
      estimatedValue: input.estimatedValue,
      quantity: input.quantity ?? null,
      unit: input.unit?.trim() || null,
      notes: input.notes?.trim() || null,
      acquiredAt: input.acquiredAt ?? null,
    },
  });

  revalidatePath("/assets");
  return result;
}

export async function setSimulationBaseBoothByEmail(input: {
  email: string;
  boothId: string;
}) {
  const user = await ensureAppUserByEmail({ email: input.email });

  const ownership = await prisma.boothOwnership.findFirst({
    where: {
      userId: user.id,
      boothId: input.boothId,
    },
    include: {
      booth: true,
    },
  });

  if (!ownership) {
    throw new Error("Booth not found in your portfolio");
  }

  if (ownership.booth.packageType === BoothPackageType.EXCLUSIVE) {
    throw new Error("Exclusive booths cannot be used as simulation base price");
  }

  const updatedUser = await prisma.appUser.update({
    where: { id: user.id },
    data: {
      boothBasePrice: ownership.capitalAmount,
    },
  });

  revalidatePath("/assets");
  revalidatePath("/simulation");
  revalidatePath("/collaboration");

  return {
    user: updatedUser,
    selectedBooth: {
      boothId: ownership.boothId,
      boothName: ownership.booth.name,
      packageType: ownership.booth.packageType,
      basePrice: ownership.capitalAmount,
    },
  };
}

export async function upsertUserFinanceProfile(data: {
  userId: string;
  monthlyExpenseMin: number;
  monthlyExpenseMax: number;
  purchaseTiming: BoothPurchaseTiming;
  purchaseDayOverride?: number | null;
  openingBalance?: number;
  idleCashTarget?: number;
  renewEconomyBoothContracts?: boolean;
  renewExclusiveBoothContracts?: boolean;
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

  const idleCashTarget = data.idleCashTarget ?? 1_000_000_000;

  if (idleCashTarget < 0) {
    throw new Error("Strategic target values must be zero or positive");
  }

  const result = await prisma.userFinanceProfile.upsert({
    where: { userId: data.userId },
    update: {
      monthlyExpenseMin: data.monthlyExpenseMin,
      monthlyExpenseMax: data.monthlyExpenseMax,
      purchaseTiming: data.purchaseTiming,
      purchaseDayOverride: data.purchaseDayOverride ?? null,
      openingBalance: data.openingBalance ?? 0,
      idleCashTarget,
      renewEconomyBoothContracts: data.renewEconomyBoothContracts ?? true,
      renewExclusiveBoothContracts: data.renewExclusiveBoothContracts ?? true,
    },
    create: {
      userId: data.userId,
      monthlyExpenseMin: data.monthlyExpenseMin,
      monthlyExpenseMax: data.monthlyExpenseMax,
      purchaseTiming: data.purchaseTiming,
      purchaseDayOverride: data.purchaseDayOverride ?? null,
      openingBalance: data.openingBalance ?? 0,
      idleCashTarget,
      renewEconomyBoothContracts: data.renewEconomyBoothContracts ?? true,
      renewExclusiveBoothContracts: data.renewExclusiveBoothContracts ?? true,
    },
  });

  revalidatePath("/simulation");
  revalidatePath("/collaboration");

  return result;
}

export async function getCollaborationWorkspace(email: string) {
  const currentUser = await ensureAppUserByEmail({ email });

  const [
    friendships,
    incomingProposals,
    outgoingProposals,
    portfolio,
    nonBoothAssets,
    targetProgress,
    financeProfile,
  ] =
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
      prisma.userAsset.findMany({
        where: { ownerUserId: currentUser.id },
        orderBy: { createdAt: "desc" },
      }),
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
    nonBoothAssets,
    targetProgress,
    financeProfile,
  };
}

export async function getSidebarProfileSummary(email: string) {
  const currentUser = await ensureAppUserByEmail({ email });

  const [friendsCount, pendingIncomingCount] = await Promise.all([
    prisma.friendship.count({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ requesterId: currentUser.id }, { addresseeId: currentUser.id }],
      },
    }),
    prisma.friendship.count({
      where: {
        status: FriendshipStatus.PENDING,
        addresseeId: currentUser.id,
      },
    }),
  ]);

  return {
    userId: currentUser.id,
    email: currentUser.email,
    displayName: currentUser.displayName,
    profilePhotoUrl: currentUser.profilePhotoUrl,
    friendsCount,
    pendingIncomingCount,
  };
}

export async function getPublicProfileByEmail(input: {
  profileEmail: string;
  viewerEmail?: string;
}) {
  const profileEmail = input.profileEmail.trim().toLowerCase();
  const profileUser = await prisma.appUser.findUnique({ where: { email: profileEmail } });
  if (!profileUser) {
    throw new Error("User profile not found");
  }

  const [portfolio, boothTarget, growthTargets, friendships] = await Promise.all([
    getUserBoothPortfolio(profileUser.id),
    getUserBoothTargetProgress(profileUser.id),
    prisma.userGrowthTarget.findMany({ where: { userId: profileUser.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: profileUser.id }, { addresseeId: profileUser.id }],
      },
      include: {
        requester: true,
        addressee: true,
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);

  let relationship: "SELF" | "NONE" | "PENDING_IN" | "PENDING_OUT" | "ACCEPTED" | "REJECTED" | "BLOCKED" = "NONE";

  if (input.viewerEmail) {
    const viewer = await prisma.appUser.findUnique({
      where: { email: input.viewerEmail.trim().toLowerCase() },
    });

    if (viewer?.id === profileUser.id) {
      relationship = "SELF";
    } else if (viewer) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: viewer.id, addresseeId: profileUser.id },
            { requesterId: profileUser.id, addresseeId: viewer.id },
          ],
        },
      });

      if (!friendship) {
        relationship = "NONE";
      } else if (friendship.status === FriendshipStatus.PENDING) {
        relationship = friendship.requesterId === viewer.id ? "PENDING_OUT" : "PENDING_IN";
      } else {
        relationship = friendship.status;
      }
    }
  }

  const connectedCount = await prisma.friendship.count({
    where: {
      status: FriendshipStatus.ACCEPTED,
      OR: [{ requesterId: profileUser.id }, { addresseeId: profileUser.id }],
    },
  });

  return {
    profileUser,
    boothTarget,
    growthTargets,
    connectedCount,
    portfolioCount: portfolio.length,
    portfolio,
    recentConnections: friendships.map((item) => ({
      id: item.id,
      status: item.status,
      createdAt: item.createdAt,
      friend:
        item.requesterId === profileUser.id
          ? item.addressee
          : item.requester,
    })),
    relationship,
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
  packageType?: BoothPackageType;
  mouSignedAt?: Date;
  mouDocumentName?: string;
  mouDocumentMimeType?: string;
  mouDocumentBase64?: string;
  referralEconomyBooths?: number;
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
    packageType: input.packageType,
    mouSignedAt: input.mouSignedAt,
    mouDocumentName: input.mouDocumentName,
    mouDocumentMimeType: input.mouDocumentMimeType,
    mouDocumentBase64: input.mouDocumentBase64,
    referralEconomyBooths: input.referralEconomyBooths,
    selectedBoothType: input.selectedBoothType,
    notes: input.notes,
  });
}

export async function createNonBoothAssetByEmail(input: {
  ownerEmail: string;
  type: AssetType;
  name: string;
  estimatedValue: number;
  quantity?: number | null;
  unit?: string | null;
  notes?: string | null;
  acquiredAt?: Date | null;
}) {
  const owner = await ensureAppUserByEmail({ email: input.ownerEmail });
  return createNonBoothAsset({
    ownerUserId: owner.id,
    type: input.type,
    name: input.name,
    estimatedValue: input.estimatedValue,
    quantity: input.quantity,
    unit: input.unit,
    notes: input.notes,
    acquiredAt: input.acquiredAt,
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
  idleCashTarget?: number;
  renewEconomyBoothContracts?: boolean;
  renewExclusiveBoothContracts?: boolean;
}) {
  const user = await ensureAppUserByEmail({ email: input.email });
  return upsertUserFinanceProfile({
    userId: user.id,
    monthlyExpenseMin: input.monthlyExpenseMin,
    monthlyExpenseMax: input.monthlyExpenseMax,
    purchaseTiming: input.purchaseTiming,
    purchaseDayOverride: input.purchaseDayOverride,
    openingBalance: input.openingBalance,
    idleCashTarget: input.idleCashTarget,
    renewEconomyBoothContracts: input.renewEconomyBoothContracts,
    renewExclusiveBoothContracts: input.renewExclusiveBoothContracts,
  });
}
export async function deleteBoothOwnership(ownershipId: string) {
    const ownership = await prisma.boothOwnership.findUnique({
        where: { id: ownershipId },
        include: { booth: true }
    });

    if (!ownership) throw new Error("Ownership record not found");

    await prisma.boothOwnership.delete({
        where: { id: ownershipId }
    });

    // Optionally check if booth has no more owners and delete it, but for simplicity we keep it or just assume cleanup elsewhere
    // For this prototype, deleting ownership is enough to remove it from user portfolio.

    revalidatePath("/assets");
    revalidatePath("/income");
    revalidatePath("/targets");
    revalidatePath("/simulation");
}

export async function updateBoothOwnership(id: string, data: {
    capitalAmount?: number;
    revenueSharePct?: number;
}) {
    const result = await prisma.boothOwnership.update({
        where: { id },
        data
    });
    revalidatePath("/assets");
    revalidatePath("/simulation");
    revalidatePath("/collaboration");
    return result;
}

export async function updateBooth(id: string, data: {
    name?: string;
    expectedMonthlyIncome?: number;
}) {
    const result = await prisma.booth.update({
        where: { id },
        data
    });
    revalidatePath("/assets");
    revalidatePath("/simulation");
    revalidatePath("/collaboration");
    return result;
}

export async function updateUserEmailByEmail(input: {
  currentEmail: string;
  newEmail: string;
}) {
  const currentEmail = input.currentEmail.trim().toLowerCase();
  const newEmail = input.newEmail.trim().toLowerCase();

  if (!newEmail || !newEmail.includes("@")) {
    throw new Error("Email baru tidak valid");
  }

  if (currentEmail === newEmail) {
    return await requireUserByEmail(currentEmail);
  }

  const existing = await prisma.appUser.findUnique({ where: { email: newEmail } });
  if (existing) {
    throw new Error("Email sudah digunakan akun lain");
  }

  const user = await requireUserByEmail(currentEmail);
  const updated = await prisma.appUser.update({
    where: { id: user.id },
    data: { email: newEmail },
  });

  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/collaboration");
  revalidatePath("/simulation");

  return updated;
}

export async function deleteUserAccountByEmail(input: { email: string }) {
  const email = input.email.trim().toLowerCase();
  const user = await requireUserByEmail(email);

  await prisma.$transaction(async (tx) => {
    const ownedIncomeSources = await tx.incomeSource.findMany({
      where: { ownerUserId: user.id },
      select: { id: true },
    });

    const sourceIds = ownedIncomeSources.map((item) => item.id);
    if (sourceIds.length > 0) {
      await tx.transaction.deleteMany({
        where: {
          sourceId: { in: sourceIds },
        },
      });
    }

    await tx.boothMonthlySale.deleteMany({ where: { uploadedById: user.id } });
    await tx.friendship.deleteMany({
      where: {
        OR: [{ requesterId: user.id }, { addresseeId: user.id }],
      },
    });
    await tx.jointBoothProposal.deleteMany({
      where: {
        OR: [{ requesterId: user.id }, { partnerId: user.id }],
      },
    });
    await tx.boothOwnership.deleteMany({ where: { userId: user.id } });
    await tx.userAsset.deleteMany({ where: { ownerUserId: user.id } });
    await tx.userGrowthTarget.deleteMany({ where: { userId: user.id } });
    await tx.userNotification.deleteMany({ where: { userId: user.id } });
    await tx.userFinanceProfile.deleteMany({ where: { userId: user.id } });
    await tx.userBoothTarget.deleteMany({ where: { userId: user.id } });
    await tx.incomeSource.deleteMany({ where: { ownerUserId: user.id } });

    await tx.appUser.delete({ where: { id: user.id } });
  });

  revalidatePath("/overview");
  revalidatePath("/assets");
  revalidatePath("/income");
  revalidatePath("/profile");
  revalidatePath("/settings");
}

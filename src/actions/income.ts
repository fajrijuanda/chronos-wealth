"use server";

import { prisma } from "@/lib/prisma";
import { CategoryType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ensureAppUserByEmail } from "@/actions/collaboration";
import { getSessionUserEmail } from "@/lib/auth-session";
import { isSuperAdminEmail } from "@/lib/active-user";
import { addMonths } from "date-fns";

async function getSessionActor() {
  const sessionEmail = await getSessionUserEmail();
  if (!sessionEmail) {
    throw new Error("Unauthorized");
  }

  const actor = await ensureAppUserByEmail({ email: sessionEmail });
  return {
    actor,
    sessionEmail,
    isSuperAdmin: isSuperAdminEmail(sessionEmail),
  };
}

async function assertIncomeSourceAccess(incomeSourceId: string) {
  const actorCtx = await getSessionActor();
  const source = await prisma.incomeSource.findUnique({
    where: { id: incomeSourceId },
    select: { id: true, ownerUserId: true },
  });

  if (!source) {
    throw new Error("Income source not found");
  }

  if (!actorCtx.isSuperAdmin && source.ownerUserId !== actorCtx.actor.id) {
    throw new Error("Unauthorized");
  }

  return source;
}

export async function getIncomeSources() {
  const { actor, isSuperAdmin } = await getSessionActor();
  
  if (!isSuperAdmin) {
    // Non-admin users can only access their own income sources
    return prisma.incomeSource.findMany({
      where: { ownerUserId: actor.id, isActive: true },
      orderBy: [{ payoutDate: "asc" }, { name: "asc" }],
    });
  }
  
  // Admin can see all income sources
  return await prisma.incomeSource.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getIncomeSourcesByUserId(userId: string) {
  return prisma.incomeSource.findMany({
    where: { ownerUserId: userId, isActive: true },
    orderBy: [{ payoutDate: "asc" }, { name: "asc" }],
  });
}

export async function getIncomeSourcesByEmail(email: string) {
  const user = await ensureAppUserByEmail({ email });
  return getIncomeSourcesByUserId(user.id);
}

export async function createIncomeSource(data: {
  name: string;
  category: CategoryType;
  amount: number;
  isRecurring: boolean;
  payoutDate?: number | null;
  expectedDate?: Date | null;
  contractDurationMonths?: number | null;
  ownerUserId?: string | null;
}) {
  let contractEndDate: Date | null = null;
  
  // Calculate contract end date based on contractDurationMonths if provided
  if (data.isRecurring && data.expectedDate) {
    const durationMonths = data.contractDurationMonths ?? (data.category === CategoryType.COMMISSION ? 24 : null);
    if (durationMonths) {
      contractEndDate = addMonths(data.expectedDate, durationMonths);
    }
  }
  
  const result = await prisma.incomeSource.create({
    data: {
      name: data.name,
      category: data.category,
      amount: data.amount,
      isRecurring: data.isRecurring,
      payoutDate: data.payoutDate,
      expectedDate: data.expectedDate,
      contractDurationMonths: data.contractDurationMonths,
      contractEndDate,
    },
  });
  revalidatePath("/income");
  return result;
}

export async function createIncomeSourceByEmail(data: {
  ownerEmail: string;
  name: string;
  category: CategoryType;
  amount: number;
  isRecurring: boolean;
  payoutDate?: number | null;
  expectedDate?: Date | null;
  contractDurationMonths?: number | null;
}) {
  const { sessionEmail, isSuperAdmin } = await getSessionActor();
  const normalizedOwnerEmail = data.ownerEmail.trim().toLowerCase();
  if (!isSuperAdmin && normalizedOwnerEmail !== sessionEmail) {
    throw new Error("Unauthorized");
  }

  const owner = await ensureAppUserByEmail({ email: data.ownerEmail });
  return createIncomeSource({
    ownerUserId: owner.id,
    name: data.name,
    category: data.category,
    amount: data.amount,
    isRecurring: data.isRecurring,
    payoutDate: data.payoutDate,
    expectedDate: data.expectedDate,
    contractDurationMonths: data.contractDurationMonths,
  });
}

export async function deleteIncomeSource(id: string) {
  await assertIncomeSourceAccess(id);
  await prisma.incomeSource.delete({
    where: { id },
  });
  revalidatePath("/income");
}

export async function toggleIncomeSourceActive(id: string, isActive: boolean) {
  await assertIncomeSourceAccess(id);
  await prisma.incomeSource.update({
    where: { id },
    data: { isActive },
  });
  revalidatePath("/income");
}

export async function updateIncomeSource(id: string, data: Partial<{
  name: string;
  category: CategoryType;
  amount: number;
  isRecurring: boolean;
  payoutDate: number | null;
  expectedDate: Date | null;
  contractDurationMonths: number | null;
  isActive: boolean;
}>) {
  await assertIncomeSourceAccess(id);
  const result = await prisma.incomeSource.update({
    where: { id },
    data,
  });
  revalidatePath("/income");
  return result;
}

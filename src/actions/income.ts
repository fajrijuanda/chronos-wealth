"use server";

import { prisma } from "@/lib/prisma";
import { CategoryType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { ensureAppUserByEmail } from "@/actions/collaboration";

export async function getIncomeSources() {
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
  ownerUserId?: string | null;
}) {
  const result = await prisma.incomeSource.create({
    data,
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
}) {
  const owner = await ensureAppUserByEmail({ email: data.ownerEmail });
  return createIncomeSource({
    ownerUserId: owner.id,
    name: data.name,
    category: data.category,
    amount: data.amount,
    isRecurring: data.isRecurring,
    payoutDate: data.payoutDate,
    expectedDate: data.expectedDate,
  });
}

export async function deleteIncomeSource(id: string) {
  await prisma.incomeSource.delete({
    where: { id },
  });
  revalidatePath("/income");
}

export async function toggleIncomeSourceActive(id: string, isActive: boolean) {
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
  isActive: boolean;
}>) {
  const result = await prisma.incomeSource.update({
    where: { id },
    data,
  });
  revalidatePath("/income");
  return result;
}

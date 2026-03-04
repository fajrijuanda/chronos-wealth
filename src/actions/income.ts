"use server";

import { prisma } from "@/lib/prisma";
import { CategoryType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getIncomeSources() {
  return await prisma.incomeSource.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createIncomeSource(data: {
  name: string;
  category: CategoryType;
  amount: number;
  isRecurring: boolean;
  payoutDate?: number | null;
  expectedDate?: Date | null;
}) {
  const result = await prisma.incomeSource.create({
    data,
  });
  revalidatePath("/income");
  return result;
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

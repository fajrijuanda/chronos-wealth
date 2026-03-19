"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSavingGoals() {
  return await prisma.savingGoal.findMany({
    orderBy: { priority: "asc" },
  });
}

export async function createSavingGoal(data: {
  name: string;
  targetAmount: number;
  deadline: Date;
  priority: number;
}) {
  const result = await prisma.savingGoal.create({
    data,
  });
  revalidatePath("/targets");
  return result;
}

export async function updateSavingGoalProgress(
  id: string,
  amountToAdd: number,
) {
  const goal = await prisma.savingGoal.findUnique({ where: { id } });
  if (!goal) throw new Error("Goal not found");

  const result = await prisma.savingGoal.update({
    where: { id },
    data: { currentAmount: goal.currentAmount + amountToAdd },
  });
  revalidatePath("/targets");
  return result;
}

export async function updateSavingGoal(
    id: string,
    data: {
        name?: string;
        targetAmount?: number;
        currentAmount?: number;
        deadline?: Date;
        priority?: number;
    }
) {
    const result = await prisma.savingGoal.update({
        where: { id },
        data,
    });
    revalidatePath("/targets");
    return result;
}

export async function deleteSavingGoal(id: string) {
    await prisma.savingGoal.delete({
        where: { id },
    });
    revalidatePath("/targets");
}

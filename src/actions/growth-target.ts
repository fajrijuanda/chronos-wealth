"use server";

import { GrowthTargetKind } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureAppUserByEmail } from "@/actions/collaboration";

export async function getGrowthTargetsByEmail(email: string) {
  const user = await ensureAppUserByEmail({ email });

  return prisma.userGrowthTarget.findMany({
    where: { userId: user.id },
    orderBy: [{ kind: "asc" }, { createdAt: "desc" }],
  });
}

export async function createGrowthTargetByEmail(input: {
  email: string;
  kind: GrowthTargetKind;
  title: string;
  targetValue: number;
  currentValue?: number;
  unit: string;
  note?: string;
  deadline?: Date | null;
}) {
  const user = await ensureAppUserByEmail({ email: input.email });

  if (!input.title.trim()) {
    throw new Error("Target title is required");
  }

  if (!Number.isFinite(input.targetValue) || input.targetValue <= 0) {
    throw new Error("Target value must be greater than 0");
  }

  const currentValue = input.currentValue ?? 0;
  if (!Number.isFinite(currentValue) || currentValue < 0) {
    throw new Error("Current value cannot be negative");
  }

  if (!input.unit.trim()) {
    throw new Error("Unit is required");
  }

  const result = await prisma.userGrowthTarget.create({
    data: {
      userId: user.id,
      kind: input.kind,
      title: input.title.trim(),
      targetValue: input.targetValue,
      currentValue,
      unit: input.unit.trim(),
      note: input.note?.trim() || null,
      deadline: input.deadline ?? null,
    },
  });

  revalidatePath("/targets");
  revalidatePath("/profile");

  return result;
}

export async function updateGrowthTarget(input: {
  id: string;
  title?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  note?: string | null;
  deadline?: Date | null;
}) {
  if (input.targetValue !== undefined && (!Number.isFinite(input.targetValue) || input.targetValue <= 0)) {
    throw new Error("Target value must be greater than 0");
  }

  if (input.currentValue !== undefined && (!Number.isFinite(input.currentValue) || input.currentValue < 0)) {
    throw new Error("Current value cannot be negative");
  }

  const result = await prisma.userGrowthTarget.update({
    where: { id: input.id },
    data: {
      title: input.title?.trim(),
      targetValue: input.targetValue,
      currentValue: input.currentValue,
      unit: input.unit?.trim(),
      note: input.note === undefined ? undefined : (input.note?.trim() || null),
      deadline: input.deadline === undefined ? undefined : input.deadline,
    },
  });

  revalidatePath("/targets");
  revalidatePath("/profile");

  return result;
}

export async function addGrowthTargetProgress(id: string, amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Progress amount must be greater than 0");
  }

  const target = await prisma.userGrowthTarget.findUnique({ where: { id } });
  if (!target) {
    throw new Error("Target not found");
  }

  const result = await prisma.userGrowthTarget.update({
    where: { id },
    data: {
      currentValue: target.currentValue + amount,
    },
  });

  revalidatePath("/targets");
  revalidatePath("/profile");

  return result;
}

export async function deleteGrowthTarget(id: string) {
  await prisma.userGrowthTarget.delete({ where: { id } });

  revalidatePath("/targets");
  revalidatePath("/profile");
}

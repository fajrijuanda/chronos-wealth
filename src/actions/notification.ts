"use server";

import {
  NotificationPriority,
  NotificationType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createUserNotification(input: {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  body: string;
  href?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const result = await prisma.userNotification.create({
    data: {
      userId: input.userId,
      type: input.type,
      priority: input.priority ?? NotificationPriority.MEDIUM,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      metadata: input.metadata ?? null,
    },
  });

  revalidatePath("/overview");
  revalidatePath("/settings");
  return result;
}

export async function getUserNotificationsByEmail(email: string) {
  const user = await prisma.appUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    return [];
  }

  return prisma.userNotification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationAsRead(id: string, email: string) {
  const notification = await prisma.userNotification.findUnique({ where: { id } });
  if (!notification) {
    throw new Error("Notification not found");
  }

  const user = await prisma.appUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || notification.userId !== user.id) {
    throw new Error("Unauthorized notification action");
  }

  await prisma.userNotification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  revalidatePath("/overview");
}

export async function markAllNotificationsAsRead(email: string) {
  const user = await prisma.appUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return;

  await prisma.userNotification.updateMany({
    where: {
      userId: user.id,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  revalidatePath("/overview");
}

export async function deleteNotification(id: string, email: string) {
  const notification = await prisma.userNotification.findUnique({ where: { id } });
  if (!notification) {
    throw new Error("Notification not found");
  }

  const user = await prisma.appUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user || notification.userId !== user.id) {
    throw new Error("Unauthorized notification action");
  }

  await prisma.userNotification.delete({ where: { id } });

  revalidatePath("/overview");
}

export async function deleteAllNotifications(email: string) {
  const user = await prisma.appUser.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return;

  await prisma.userNotification.deleteMany({
    where: { userId: user.id },
  });

  revalidatePath("/overview");
}

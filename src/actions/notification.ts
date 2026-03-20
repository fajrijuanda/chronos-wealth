"use server";

import {
  NotificationPriority,
  NotificationType,
  Prisma,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

async function emitNotificationViaWebSocket(userId: string, notification: any) {
  try {
    // Emit notification via WebSocket
    await fetch(process.env.INTERNAL_API_URL || "http://localhost:3000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "notify",
        userId,
        data: notification,
      }),
    }).catch(() => {
      // Silently fail if WebSocket server is not available
      console.warn(`Could not emit notification via WebSocket for user ${userId}`);
    });
  } catch (error) {
    console.error("WebSocket emission error:", error);
  }
}

export async function createUserNotification(input: {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  body: string;
  href?: string | null;
  metadata?: Prisma.InputJsonValue;
}) {
  const result = await prisma.userNotification.create({
    data: {
      userId: input.userId,
      type: input.type,
      priority: input.priority ?? NotificationPriority.MEDIUM,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      metadata: input.metadata,
    },
  });

  // Emit in real-time via WebSocket
  await emitNotificationViaWebSocket(input.userId, result);

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

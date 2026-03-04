import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This endpoint should be triggered by Vercel Cron or a similar scheduler daily.
// Example cron expression: 0 0 * * *
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    // Simple protection: ensure the request is authorized via Cron secret
    // You must set CRON_SECRET in Vercel environment variables
    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayDate = new Date().getDate(); // 1 - 31

    // Find all active recurring incomes that payout today
    const recurringIncomes = await prisma.incomeSource.findMany({
      where: {
        isRecurring: true,
        isActive: true,
        payoutDate: todayDate,
      },
    });

    let insertedCount = 0;

    for (const source of recurringIncomes) {
      await prisma.transaction.create({
        data: {
          type: "INCOME",
          amount: source.amount,
          description: `Auto-deposit: ${source.name}`,
          sourceId: source.id,
        },
      });
      insertedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${insertedCount} recurring incomes for date ${todayDate}.`,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

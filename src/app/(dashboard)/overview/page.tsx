import { getCollaborationWorkspace } from "@/actions/collaboration";
import { getDashboardMetrics } from "@/actions/transaction";
import { prisma } from "@/lib/prisma";
import { getActiveUserEmail } from "@/lib/active-user";
import { FriendshipStatus } from "@prisma/client";
import { OverviewAnalyticsDeck } from "./OverviewAnalyticsDeck";

export default async function OverviewPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp = await searchParams;
    const activeEmail = await getActiveUserEmail(
        typeof sp.user === "string" ? sp.user : undefined,
    );

    const [metrics, workspace] = await Promise.all([
        getDashboardMetrics(),
        getCollaborationWorkspace(activeEmail),
    ]);

    const [activeIncomeCount, growthTargetCount, notificationStats, friendshipStats] = await Promise.all([
        prisma.incomeSource.count({
            where: {
                ownerUserId: workspace.currentUser.id,
                isActive: true,
            },
        }),
        prisma.userGrowthTarget.count({
            where: { userId: workspace.currentUser.id },
        }),
        prisma.userNotification.aggregate({
            where: { userId: workspace.currentUser.id },
            _count: { id: true },
        }),
        prisma.friendship.groupBy({
            by: ["status"],
            where: {
                OR: [
                    { requesterId: workspace.currentUser.id },
                    { addresseeId: workspace.currentUser.id },
                ],
            },
            _count: { _all: true },
        }),
    ]);

    const friendshipsByStatus = new Map(friendshipStats.map((item) => [item.status, item._count._all]));
    const acceptedFriendCount = friendshipsByStatus.get(FriendshipStatus.ACCEPTED) ?? 0;
    const pendingFriendCount = friendshipsByStatus.get(FriendshipStatus.PENDING) ?? 0;

    const unreadNotificationCount = await prisma.userNotification.count({
        where: {
            userId: workspace.currentUser.id,
            readAt: null,
        },
    });

    const savingsRatePct =
        metrics.monthlyIncome > 0
            ? Math.max(0, ((metrics.monthlyIncome - metrics.monthlyExpense) / metrics.monthlyIncome) * 100)
            : 0;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="mb-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">Business Analytics</h1>
                <p className="text-muted-foreground">Ringkasan performa finansial, koneksi, target, dan aktivitas akun Anda.</p>
            </div>

            <OverviewAnalyticsDeck
                balance={metrics.totalBalance}
                monthlyIncome={metrics.monthlyIncome}
                monthlyExpense={metrics.monthlyExpense}
                savingsRatePct={savingsRatePct}
                targetBoothEquivalent={workspace.targetProgress.targetBoothEquivalent}
                boothEquivalentAchieved={workspace.targetProgress.boothEquivalentAchieved}
                targetProgressPct={workspace.targetProgress.progressPct}
                monthlyIncomeShare={workspace.targetProgress.monthlyIncomeShare}
                portfolioCount={workspace.portfolio.length}
                nonBoothAssetCount={workspace.nonBoothAssets.length}
                activeIncomeCount={activeIncomeCount}
                activeGrowthTargetCount={growthTargetCount}
                acceptedFriendCount={acceptedFriendCount}
                pendingFriendCount={pendingFriendCount}
                unreadNotificationCount={unreadNotificationCount}
                notificationTotalCount={notificationStats._count.id}
            />
        </div>
    );
}

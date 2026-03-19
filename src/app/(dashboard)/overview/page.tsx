import { getCollaborationWorkspace } from "@/actions/collaboration";
import { getDashboardMetrics } from "@/actions/transaction";
import { getActiveUserEmail } from "@/lib/active-user";
import { formatGroupedNumber } from "@/lib/number-format";
import { Wallet, TrendingDown, Target } from "lucide-react";
import { MetricCard } from "@/components/ui/metric-card";

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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-2xl font-semibold tracking-tight mb-2 md:text-3xl">Dashboard Overview</h1>
                <p className="text-muted-foreground">Welcome back. Here is your financial summary.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Balance"
                    value={`Rp ${formatGroupedNumber(metrics.totalBalance)}`}
                    icon={Wallet}
                    tone="projection"
                />

                <MetricCard
                    title="Mo. Income"
                    value={`Rp ${formatGroupedNumber(metrics.monthlyIncome)}`}
                    icon={TrendingDown}
                    tone="income"
                />

                <MetricCard
                    title="Mo. Expense"
                    value={`Rp ${formatGroupedNumber(metrics.monthlyExpense)}`}
                    icon={TrendingDown}
                    tone="expense"
                />

                <MetricCard
                    title="Active Targets"
                    value={`${formatGroupedNumber(workspace.targetProgress.targetBoothEquivalent)} Booth Eq.`}
                    subtitle={`Monthly: Rp ${formatGroupedNumber(workspace.targetProgress.monthlyIncomeShare)}`}
                    icon={Target}
                    tone="goal"
                />
            </div>

            {/* Placeholder for Recharts Chart */}
            <div className="rounded-3xl backdrop-blur-xl bg-card/75 p-6 border border-border/85 shadow-[0_20px_36px_-30px_rgba(96,103,182,0.95)] ring-1 ring-white/60 min-h-100 dark:ring-white/10">
                <h2 className="font-display text-xl font-semibold text-title mb-6">Cashflow Trend</h2>
                <div className="flex h-75 items-center justify-center border-2 border-dashed border-border rounded-2xl bg-white/35 dark:bg-white/5">
                    <div className="text-center text-muted-foreground space-y-1">
                        <p>
                            Progress target booth: {workspace.targetProgress.progressPct.toFixed(2)}%
                        </p>
                        <p>
                            Equivalent achieved: {workspace.targetProgress.boothEquivalentAchieved.toFixed(2)} booth
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

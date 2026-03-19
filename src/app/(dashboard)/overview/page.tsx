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
                <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard Overview</h1>
                <p className="text-slate-500 dark:text-slate-400">Welcome back. Here is your financial summary.</p>
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
            <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm min-h-100">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6">Cashflow Trend</h2>
                <div className="flex h-75 items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="text-center text-slate-500 space-y-1">
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

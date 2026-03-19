import { getCollaborationWorkspace } from "@/actions/collaboration";
import { getDashboardMetrics } from "@/actions/transaction";
import { getActiveUserEmail } from "@/lib/active-user";
import { Wallet, TrendingDown, Target } from "lucide-react";

export default async function OverviewPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp = await searchParams;
    const activeEmail = getActiveUserEmail(
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Balance Card */}
                <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
                            <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Total Balance</h2>
                    </div>
                    <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Rp {metrics.totalBalance.toLocaleString("id-ID")}
                    </p>
                </div>

                {/* Monthly Income Card */}
                <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                            <TrendingDown className="w-6 h-6 text-emerald-600 dark:text-emerald-400 rotate-180" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Mo. Income</h2>
                    </div>
                    <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Rp {metrics.monthlyIncome.toLocaleString("id-ID")}
                    </p>
                </div>

                {/* Active Targets Card */}
                <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Active Targets</h2>
                    </div>
                    <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {workspace.targetProgress.targetBoothEquivalent.toLocaleString("id-ID")} Booth Eq.
                    </p>
                    <p className="text-sm text-slate-500">
                        Monthly share: Rp {workspace.targetProgress.monthlyIncomeShare.toLocaleString("id-ID")}
                    </p>
                </div>
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

import { Wallet, TrendingDown, Target } from "lucide-react";

export default function OverviewPage() {
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
                    <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Rp 45.000.000</p>
                </div>

                {/* Monthly Income Card */}
                <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                            <TrendingDown className="w-6 h-6 text-emerald-600 dark:text-emerald-400 rotate-180" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Mo. Income</h2>
                    </div>
                    <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Rp 12.500.000</p>
                </div>

                {/* Active Targets Card */}
                <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Active Targets</h2>
                    </div>
                    <p className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">3 Goals</p>
                </div>
            </div>

            {/* Placeholder for Recharts Chart */}
            <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm min-h-[400px]">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6">Cashflow Trend</h2>
                <div className="flex h-[300px] items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <span className="text-slate-500">Chart will be rendered here</span>
                </div>
            </div>
        </div>
    );
}

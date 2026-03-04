import { calculateSimulation } from "@/actions/simulation";
import { Calculator, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SimulationPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const sp = await searchParams;
    const targetDateStr = typeof sp.date === 'string' ? sp.date : "2028-08-01";
    const monthlyExpenseStr = typeof sp.expense === 'string' ? sp.expense : "5000000";

    const targetDate = new Date(targetDateStr);
    const monthlyExpenseBase = parseInt(monthlyExpenseStr, 10);

    const simulation = await calculateSimulation(targetDate, monthlyExpenseBase);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Wealth Simulation</h1>
                <p className="text-slate-500 dark:text-slate-400">Time-travel forecasting to predict your target balance.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls Card */}
                <div className="lg:col-span-1 rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm h-fit">
                    <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-200">
                        <Calculator className="w-5 h-5 text-blue-500" />
                        <h2 className="font-semibold text-lg">Simulator Controls</h2>
                    </div>

                    <form className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Target Date</label>
                            <input
                                name="date"
                                type="date"
                                defaultValue={targetDateStr}
                                className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Base Monthly Expense (Rp)</label>
                            <input
                                name="expense"
                                type="number"
                                defaultValue={monthlyExpenseBase}
                                className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <Button type="submit" className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-6 text-md font-semibold mt-4">
                            Simulate Forecast <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </form>
                </div>

                {/* Results Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 shadow-lg text-white">
                        <h3 className="text-blue-100 font-medium mb-2">Projected Balance on {targetDate.toLocaleDateString()}</h3>
                        <p className="text-5xl font-bold tracking-tight">
                            Rp {Math.max(0, simulation.projectedBalance).toLocaleString("id-ID")}
                        </p>
                        <div className="mt-8 pt-6 border-t border-blue-400/30 flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-emerald-300" />
                            <p className="text-sm text-blue-100">
                                This calculation assumes active recurring incomes remain constant and identified saving goals are fulfilled precisely on their deadlines.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm">
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 mb-4">Cashflow Breakdown</h3>
                        <div className="space-y-3">
                            {simulation.breakdown.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                    <span className="text-slate-600 dark:text-slate-400 font-medium">{item.label}</span>
                                    <span className={`font-semibold ${item.type === 'positive' ? 'text-emerald-500' :
                                            item.type === 'negative' ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'
                                        }`}>
                                        {item.amount > 0 ? '+' : ''}{item.amount === 0 ? 'Rp 0' : `Rp ${item.amount.toLocaleString("id-ID")}`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

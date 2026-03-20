import { getCategoryExpenseWarning, getBudgetLimits } from "@/actions/budget";
import { AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatGroupedNumber } from "@/lib/number-format";
import { BudgetSettingsDialog } from "./BudgetSettingsDialog";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
    const limits = await getBudgetLimits();

    // Map each budget limit to include current month warning
    const categoriesWithWarning = await Promise.all(
        limits.map(async (limit) => ({
            name: limit.category,
            data: await getCategoryExpenseWarning(limit.category),
            icon: limit.category.toUpperCase().includes("FOOD") ? "🍔" : 
                  limit.category.toUpperCase().includes("LIFESTYLE") ? "🛍️" : "📦",
            color: limit.category.toUpperCase().includes("FOOD") ? "bg-orange-500" : 
                   limit.category.toUpperCase().includes("LIFESTYLE") ? "bg-pink-500" : "bg-indigo-500"
        }))
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Budget Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">Set and monitor your monthly spending limits per category.</p>
                </div>
                <BudgetSettingsDialog categories={limits} />
            </div>

            <div className="space-y-4">
                {categoriesWithWarning.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-10 text-center">
                        <p className="text-slate-500">Belum ada kategori budget. Silakan klik Edit Budget untuk menambah limit.</p>
                    </div>
                )}
                {categoriesWithWarning.map((cat, i) => {
                    const isWarning = cat.data.isWarning;
                    return (
                        <div key={i} className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner">
                                        {cat.icon}
                                    </div>
                                    <div>
                                        <h2 className="font-semibold text-lg">{cat.name}</h2>
                                        <p className="text-sm text-slate-500">
                                            Rp {formatGroupedNumber(cat.data.expenseValue)} / Rp {formatGroupedNumber(cat.data.budgetLimit)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xl font-bold ${isWarning ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {cat.data.percentage.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            <Progress
                                value={cat.data.percentage > 100 ? 100 : cat.data.percentage}
                                className={`h-3 ${isWarning ? '[&>div]:bg-red-500' : `[&>div]:${cat.color}`}`}
                            />

                            {isWarning && (
                                <Alert variant="destructive" className="mt-6 rounded-xl border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Warning</AlertTitle>
                                    <AlertDescription>
                                        You have spent {cat.data.percentage.toFixed(1)}% of your {cat.name} budget for this month!
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

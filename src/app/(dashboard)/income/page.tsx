import { getIncomeSources } from "@/actions/income";
import { PlusCircle, Wallet, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function IncomePage() {
    const incomes = await getIncomeSources();

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Income Sources</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your recurring incomes and one-time projects.</p>
                </div>
                <Button className="rounded-2xl shadow-md bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Add Income
                </Button>
            </div>

            <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Category</th>
                                <th className="px-6 py-4 font-medium">Amount</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Payout Date</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {incomes.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No income sources found. Add one to get started.
                                    </td>
                                </tr>
                            ) : (
                                incomes.map((inc) => (
                                    <tr key={inc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                                <Wallet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            {inc.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold">
                                                {inc.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                                            Rp {inc.amount.toLocaleString("id-ID")}
                                        </td>
                                        <td className="px-6 py-4">
                                            {inc.isRecurring ? "Recurring" : "One-time"}
                                        </td>
                                        <td className="px-6 py-4 flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            {inc.isRecurring ? `Every ${inc.payoutDate}th` : inc.expectedDate?.toLocaleDateString() ?? "N/A"}
                                        </td>
                                        <td className="px-6 py-4">
                                            {inc.isActive ? (
                                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full w-fit text-xs font-medium">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-xs">Inactive</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

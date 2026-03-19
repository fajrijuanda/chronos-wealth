import { getCollaborationWorkspace } from "@/actions/collaboration";
import { getActiveUserEmail } from "@/lib/active-user";
import { formatGroupedNumber } from "@/lib/number-format";
import { formatJakartaDate } from "@/lib/date-format";
import { getSavingGoals } from "@/actions/saving";
import { Target, TrendingUp, Wallet2 } from "lucide-react";
import { AddSavingGoalDialog } from "./AddSavingGoalDialog";
import { GoalCardActions } from "./GoalCardActions";
import { EditBoothTargetDialog } from "./EditBoothTargetDialog";

export default async function TargetsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp = await searchParams;
    const activeEmail = await getActiveUserEmail(
        typeof sp.user === "string" ? sp.user : undefined,
    );

    const goals = await getSavingGoals();
    const workspace = await getCollaborationWorkspace(activeEmail);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Saving Goals</h1>
                    <p className="text-slate-500 dark:text-slate-400">Punya target besar? Alokasikan dana untuk masa depan Anda di sini.</p>
                </div>
                <AddSavingGoalDialog />
            </div>

            <div className="relative group overflow-hidden">
                <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-15 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex flex-col md:flex-row items-center gap-8 rounded-2xl border border-indigo-200/60 dark:border-indigo-900/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 shadow-sm">
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                                Booth Equivalent Target
                            </h2>
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-500 dark:text-slate-400">
                                Simulasi pencapaian pasif income setara dengan <span className="font-bold text-indigo-600 dark:text-indigo-400">{workspace.targetProgress.targetBoothEquivalent} Booth</span>
                            </p>
                            <p className="text-xs text-slate-400 italic">
                                Diaumsikan dengan pendapatan rata-rata Rp {formatGroupedNumber(workspace.targetProgress.revenuePerBooth)} / Booth
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4 group/item">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Income</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">Rp {formatGroupedNumber(workspace.targetProgress.targetIncome)}</p>
                            </div>
                            <div className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 p-4 group/item">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Current Share Income</p>
                                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Rp {formatGroupedNumber(workspace.targetProgress.monthlyIncomeShare)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/20 min-w-48 text-center space-y-4">
                        <div className="space-y-1">
                            <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                                {workspace.targetProgress.progressPct.toFixed(1)}%
                            </p>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Achieved</p>
                        </div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {workspace.targetProgress.boothEquivalentAchieved.toFixed(2)} Booth
                        </div>
                        <EditBoothTargetDialog 
                            email={activeEmail} 
                            currentTarget={workspace.targetProgress.targetBoothEquivalent} 
                            currentRevenue={workspace.targetProgress.revenuePerBooth} 
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    const priorityColor = [
                        "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
                        "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
                        "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
                        "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400",
                    ][(goal.priority - 1) % 5];

                    return (
                        <div key={goal.id} className="group relative rounded-3xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[260px]">
                            <div className="absolute top-0 right-0 p-4">
                                <GoalCardActions goal={goal} />
                            </div>
                            
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                        <Wallet2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${priorityColor}`}>
                                        P{goal.priority} Priority
                                    </span>
                                </div>
                                <h3 className="font-bold text-xl text-slate-800 dark:text-white line-clamp-1 mb-1">{goal.name}</h3>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">Rp {formatGroupedNumber(goal.currentAmount)}</span>
                                    <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">of Rp {formatGroupedNumber(goal.targetAmount)}</span>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Goal Progress</span>
                                        <span className="text-sm font-black text-slate-900 dark:text-white">{progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
                                        <div 
                                            className="h-full rounded-full bg-linear-to-r from-purple-500 via-indigo-500 to-indigo-600 transition-all duration-1000"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                                    <span>Deadline</span>
                                    <span className="text-slate-500 dark:text-slate-300">{formatJakartaDate(goal.deadline)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {goals.length === 0 && (
                    <div className="col-span-full py-20 bg-slate-50/50 dark:bg-slate-950/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-4 text-center px-6 transition-all hover:bg-slate-100/50 dark:hover:bg-slate-900/30">
                        <div className="p-4 bg-white dark:bg-slate-900 rounded-full shadow-sm">
                            <Target className="w-10 h-10 text-slate-300" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-bold text-slate-500 dark:text-slate-400">No Saving Goals Yet</h3>
                            <p className="text-sm text-slate-400">Mulai buat rencana masa depan Anda dengan menambahkan target tabungan baru!</p>
                        </div>
                        <AddSavingGoalDialog />
                    </div>
                )}
            </div>
        </div>
    );
}

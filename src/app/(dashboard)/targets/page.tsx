import { getCollaborationWorkspace } from "@/actions/collaboration";
import { getActiveUserEmail } from "@/lib/active-user";
import { getSavingGoals } from "@/actions/saving";
import { PlusCircle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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
                    <p className="text-slate-500 dark:text-slate-400">Track and allocate funds for your big targets.</p>
                </div>
                <Button className="rounded-2xl shadow-md bg-purple-600 hover:bg-purple-700 text-white gap-2">
                    <PlusCircle className="w-4 h-4" />
                    New Goal
                </Button>
            </div>

            <div className="rounded-2xl border border-indigo-200/60 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-6">
                <h2 className="text-xl font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                    Booth Equivalent Target
                </h2>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4">
                    Target: {workspace.targetProgress.targetBoothEquivalent} booth x Rp {workspace.targetProgress.revenuePerBooth.toLocaleString("id-ID")}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl bg-white/80 dark:bg-black/30 p-3">
                        <p className="text-slate-500">Target Income</p>
                        <p className="font-semibold">Rp {workspace.targetProgress.targetIncome.toLocaleString("id-ID")}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 dark:bg-black/30 p-3">
                        <p className="text-slate-500">Current Share Income</p>
                        <p className="font-semibold">Rp {workspace.targetProgress.monthlyIncomeShare.toLocaleString("id-ID")}</p>
                    </div>
                    <div className="rounded-xl bg-white/80 dark:bg-black/30 p-3">
                        <p className="text-slate-500">Booth Equivalent Achieved</p>
                        <p className="font-semibold">{workspace.targetProgress.boothEquivalentAchieved.toFixed(2)} booth ({workspace.targetProgress.progressPct.toFixed(2)}%)</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);

                    return (
                        <div key={goal.id} className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-55">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                        <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full">
                                        Priority {goal.priority}
                                    </span>
                                </div>
                                <h2 className="font-semibold text-xl line-clamp-1">{goal.name}</h2>
                                <div className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                    Rp {goal.currentAmount.toLocaleString("id-ID")} / Rp {goal.targetAmount.toLocaleString("id-ID")}
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-2">
                                <div className="flex justify-between text-xs font-medium text-slate-500">
                                    <span>Progress</span>
                                    <span>{progress.toFixed(0)}%</span>
                                </div>
                                <Progress value={progress} className="h-3 [&>div]:bg-linear-to-r [&>div]:from-purple-500 [&>div]:to-indigo-500" />
                                <p className="text-xs text-slate-400 mt-2 text-right">
                                    Deadline: {new Date(goal.deadline).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    );
                })}
                {goals.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 h-40 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                        No saving goals right now. Let&apos;s create one!
                    </div>
                )}
            </div>
        </div>
    );
}

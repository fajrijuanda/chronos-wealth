import { getIncomeSources } from "@/actions/income";
import {
    getBoothSalesHistoryByEmail,
    importMonthlyBoothSalesByEmail,
} from "@/actions/booth-sales";
import { getCollaborationWorkspace } from "@/actions/collaboration";
import { getActiveUserEmail } from "@/lib/active-user";
import { redirect } from "next/navigation";
import { PlusCircle, Wallet, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function IncomePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const sp = await searchParams;
    const activeEmail = await getActiveUserEmail(
        typeof sp.user === "string" ? sp.user : undefined,
    );

    const incomes = await getIncomeSources();
    const [workspace, salesHistory] = await Promise.all([
        getCollaborationWorkspace(activeEmail),
        getBoothSalesHistoryByEmail({ email: activeEmail, limit: 24 }),
    ]);

    const userQuery = `user=${encodeURIComponent(activeEmail)}`;
    const flashOk = typeof sp.ok === "string" ? sp.ok : null;
    const flashError = typeof sp.error === "string" ? sp.error : null;

    async function handleSalesUpload(formData: FormData) {
        "use server";

        const uploadedByEmail = String(formData.get("uploadedByEmail") ?? "");
        const month = Number(formData.get("month") ?? 0);
        const year = Number(formData.get("year") ?? 0);
        const file = formData.get("salesFile");

        if (!(file instanceof File)) {
            redirect(`/income?${userQuery}&error=${encodeURIComponent("Please upload an Excel file")}`);
        }

        try {
            const result = await importMonthlyBoothSalesByEmail({
                uploadedByEmail,
                month,
                year,
                file,
            });

            redirect(
                `/income?${userQuery}&ok=${encodeURIComponent(
                    `${result.imported} sales rows imported for ${month}/${year}`,
                )}`,
            );
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Upload failed";
            redirect(`/income?${userQuery}&error=${encodeURIComponent(message)}`);
        }
    }

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

            {flashOk && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm">
                    {flashOk}
                </div>
            )}

            {flashError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
                    {flashError}
                </div>
            )}

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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-2">Upload Monthly Booth Sales (Excel)</h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Gunakan kolom seperti: booth/nama booth, gross/omzet, net/profit.
                    </p>

                    <form action={handleSalesUpload} className="space-y-3">
                        <input type="hidden" name="uploadedByEmail" value={workspace.currentUser.email} />

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="sales-month" className="text-sm font-medium">Month</label>
                                <input
                                    id="sales-month"
                                    name="month"
                                    type="number"
                                    min={1}
                                    max={12}
                                    defaultValue={new Date().getMonth() + 1}
                                    className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label htmlFor="sales-year" className="text-sm font-medium">Year</label>
                                <input
                                    id="sales-year"
                                    name="year"
                                    type="number"
                                    min={2000}
                                    defaultValue={new Date().getFullYear()}
                                    className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="sales-file" className="text-sm font-medium">Excel File</label>
                            <input
                                id="sales-file"
                                name="salesFile"
                                type="file"
                                accept=".xlsx,.xls"
                                required
                                className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                            />
                        </div>

                        <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white">
                            Upload Sales
                        </Button>
                    </form>
                </div>

                <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 shadow-sm p-6">
                    <h2 className="text-xl font-semibold mb-2">Your Booth Share Summary</h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Pendapatanmu dihitung dari porsi modal per booth, termasuk booth bersama.
                    </p>

                    <div className="space-y-3">
                        {workspace.portfolio.length === 0 && (
                            <p className="text-sm text-slate-500">Belum ada booth di portofolio.</p>
                        )}

                        {workspace.portfolio.slice(0, 5).map((item) => (
                            <div key={item.boothId} className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm">
                                <p className="font-semibold">{item.boothName}</p>
                                <p>Expected Income: Rp {item.expectedMonthlyIncome.toLocaleString("id-ID")}</p>
                                <p>Share: {item.revenueSharePct.toFixed(2)}%</p>
                                <p>Type: {item.isShared ? "Shared" : "Owned"}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800">
                    <h2 className="text-xl font-semibold">Booth Sales History</h2>
                    <p className="text-sm text-slate-500">Latest uploaded monthly results from your owned/shared booths.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Period</th>
                                <th className="px-6 py-4 font-medium">Booth</th>
                                <th className="px-6 py-4 font-medium">Gross</th>
                                <th className="px-6 py-4 font-medium">Net</th>
                                <th className="px-6 py-4 font-medium">Uploaded By</th>
                                <th className="px-6 py-4 font-medium">Uploaded At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {salesHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No sales uploads yet.
                                    </td>
                                </tr>
                            ) : (
                                salesHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">{`${item.month}/${item.year}`}</td>
                                        <td className="px-6 py-4 font-medium">{item.booth.name}</td>
                                        <td className="px-6 py-4 text-emerald-600">Rp {item.grossIncome.toLocaleString("id-ID")}</td>
                                        <td className="px-6 py-4">{item.netIncome ? `Rp ${item.netIncome.toLocaleString("id-ID")}` : "-"}</td>
                                        <td className="px-6 py-4">{item.uploadedBy.displayName}</td>
                                        <td className="px-6 py-4">{item.uploadedAt.toLocaleString("id-ID")}</td>
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

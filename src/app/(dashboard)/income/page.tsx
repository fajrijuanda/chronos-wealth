import { getIncomeSources } from "@/actions/income";
import {
    getBoothSalesHistoryByEmail,
    importMonthlyBoothSalesByEmail,
} from "@/actions/booth-sales";
import { getCollaborationWorkspace } from "@/actions/collaboration";
import { getActiveUserEmail } from "@/lib/active-user";
import { formatGroupedNumber } from "@/lib/number-format";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AddIncomeDialog } from "./AddIncomeDialog";
import { IncomeDataTables } from "./IncomeDataTables";

export const dynamic = "force-dynamic";

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

    async function handleSalesUpload(formData: FormData) {
        "use server";

        const uploadedByEmail = String(formData.get("uploadedByEmail") ?? "");
        const month = Number(formData.get("month") ?? 0);
        const year = Number(formData.get("year") ?? 0);
        const file = formData.get("salesFile");

        if (!(file instanceof File)) {
            redirect(`/income?${userQuery}&error=${encodeURIComponent("Please upload an Excel file")}`);
        }

        let result;
        try {
            result = await importMonthlyBoothSalesByEmail({
                uploadedByEmail,
                month,
                year,
                file,
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Upload failed";
            redirect(`/income?${userQuery}&error=${encodeURIComponent(message)}`);
        }

        if (result) {
            redirect(
                `/income?${userQuery}&ok=${encodeURIComponent(
                    `${result.imported} sales rows imported for ${month}/${year}`,
                )}`,
            );
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Income Sources</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage your recurring incomes and one-time projects.</p>
                </div>
                <AddIncomeDialog email={activeEmail} />
            </div>

            <IncomeDataTables
                incomes={incomes.map((inc) => ({
                    id: inc.id,
                    name: inc.name,
                    category: inc.category,
                    amount: inc.amount,
                    isRecurring: inc.isRecurring,
                    payoutDate: inc.payoutDate,
                    expectedDate: inc.expectedDate,
                    isActive: inc.isActive,
                }))}
                salesHistory={salesHistory.map((item) => ({
                    id: item.id,
                    month: item.month,
                    year: item.year,
                    boothName: item.booth.name,
                    grossIncome: item.grossIncome,
                    netIncome: item.netIncome ?? null,
                    uploadedBy: item.uploadedBy.displayName,
                    uploadedAt: item.uploadedAt,
                }))}
            />

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
                                <p>Expected Income: Rp {formatGroupedNumber(item.expectedMonthlyIncome)}</p>
                                <p>Share: {item.revenueSharePct.toFixed(2)}%</p>
                                <p>Type: {item.isShared ? "Shared" : "Owned"}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            
        </div>
    );
}

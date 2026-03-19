import {
  getCollaborationWorkspace,
} from "@/actions/collaboration";
import { getActiveUserEmail } from "@/lib/active-user";
import { formatGroupedNumber } from "@/lib/number-format";
import { BoothPackageType } from "@prisma/client";
import { Wallet, Info, ArrowUpRight } from "lucide-react";

import { ManualPriceForm } from "./ManualPriceForm";
import { AddAssetButton } from "./AddAssetButton";
import { AssetTableRowActions } from "./AssetTableRowActions";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const activeEmail = await getActiveUserEmail(
    typeof sp.user === "string" ? sp.user : undefined,
  );

  const workspace = await getCollaborationWorkspace(activeEmail);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Portfolio Aset</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Kelola kepemilikan booth Anda dan tentukan acuan harga simulasi.
          </p>
        </div>
        <AddAssetButton 
          email={workspace.currentUser.email} 
          basePrice={workspace.currentUser.boothBasePrice} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-3xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 shadow-sm p-8 flex flex-col md:flex-row gap-8 items-center bg-linear-to-br from-white/80 to-slate-50/50 dark:from-slate-900 dark:to-slate-800">
          <div className="bg-indigo-600 dark:bg-indigo-500 p-5 rounded-3xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
            <Wallet className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400">Acuan Harga Simulasi Saat Ini</h2>
            <div className="flex flex-col md:flex-row md:items-baseline gap-2">
                <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                  Rp {formatGroupedNumber(workspace.currentUser.boothBasePrice)}
                </span>
                <span className="text-slate-400 text-xs font-medium italic">/ Booth (Economy)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mt-3 pt-4 border-t border-slate-200/50 dark:border-slate-800">
                <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                <p>Harga ini menjadi pengali untuk menghitung target jumlah booth pada Simulation.</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 shadow-sm p-6 flex flex-col justify-center">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-indigo-500" />
            Update Price Manual
          </h3>
          <ManualPriceForm 
            email={workspace.currentUser.email} 
            currentPrice={workspace.currentUser.boothBasePrice} 
          />
        </div>
      </div>

      <div className="rounded-3xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Portofolio Booth</h2>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                {workspace.portfolio.length} Booths in Portfolio
              </p>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase font-black bg-slate-50/50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 tracking-[0.2em]">
              <tr>
                <th className="px-8 py-4">Nama Booth</th>
                <th className="px-8 py-4">Paket</th>
                <th className="px-8 py-4">Modal Anda</th>
                <th className="px-8 py-4">Target Income</th>
                <th className="px-8 py-4 text-right pr-12">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {workspace.portfolio.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-medium italic">
                    Belum ada booth di portofolio Anda.
                  </td>
                </tr>
              ) : (
                workspace.portfolio.map((item) => (
                  <tr key={item.ownershipId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                    <td className="px-8 py-5">
                        <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {item.boothName}
                        </div>
                        {item.isShared && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">Shared</span>
                        )}
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                        item.packageType === BoothPackageType.EXCLUSIVE 
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" 
                        : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                      }`}>
                        {item.packageType}
                      </span>
                    </td>
                    <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-300">
                        Rp {formatGroupedNumber(item.capitalAmount)}
                    </td>
                    <td className="px-8 py-5 text-emerald-600 dark:text-emerald-400 font-bold">
                        Rp {formatGroupedNumber(item.expectedMonthlyIncome)}
                    </td>
                    <td className="px-8 py-5 text-right pr-10">
                      <AssetTableRowActions 
                        email={activeEmail}
                        ownershipId={item.ownershipId}
                        boothId={item.boothId}
                        boothName={item.boothName}
                        packageType={item.packageType}
                        expectedMonthlyIncome={item.expectedMonthlyIncome}
                        capitalAmount={item.capitalAmount}
                        revenueSharePct={item.revenueSharePct}
                      />
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

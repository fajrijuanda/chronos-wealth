import {
  getCollaborationWorkspace,
} from "@/actions/collaboration";
import { getActiveUserEmail } from "@/lib/active-user";
import { formatGroupedNumber } from "@/lib/number-format";
import { formatJakartaDate } from "@/lib/date-format";
import { BoothPackageType } from "@prisma/client";
import { Gem, House, Layers } from "lucide-react";

import { AddAssetButton } from "./AddAssetButton";
import { AssetTableRowActions } from "./AssetTableRowActions";

export const dynamic = "force-dynamic";

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
            Kelola aset booth dan non-booth Anda dalam satu dashboard portofolio.
          </p>
        </div>
        <AddAssetButton 
          email={workspace.currentUser.email} 
          basePrice={workspace.currentUser.boothBasePrice} 
        />
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
                workspace.portfolio.map((item: {
                  ownershipId: string;
                  boothId: string;
                  boothName: string;
                  packageType: BoothPackageType;
                  expectedMonthlyIncome: number;
                  revenueSharePct: number;
                  capitalAmount: number;
                  isShared: boolean;
                }) => (
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
                        ownershipId={item.ownershipId}
                        boothId={item.boothId}
                        boothName={item.boothName}
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

      <div className="rounded-3xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Portofolio Non-Booth</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
              {workspace.nonBoothAssets.length} Non-Booth Assets
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] uppercase font-black bg-slate-50/50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 tracking-[0.2em]">
              <tr>
                <th className="px-8 py-4">Nama Asset</th>
                <th className="px-8 py-4">Tipe</th>
                <th className="px-8 py-4">Estimasi Nilai</th>
                <th className="px-8 py-4">Jumlah</th>
                <th className="px-8 py-4">Tanggal Perolehan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {workspace.nonBoothAssets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-400 font-medium italic">
                    Belum ada aset non-booth. Tambahkan emas, properti, atau aset lainnya.
                  </td>
                </tr>
              ) : (
                workspace.nonBoothAssets.map((item: {
                  id: string;
                  type: "GOLD" | "PROPERTY" | "OTHER";
                  name: string;
                  estimatedValue: number;
                  quantity: number | null;
                  unit: string | null;
                  notes: string | null;
                  acquiredAt: Date | null;
                }) => {
                  const typeMeta =
                    item.type === "GOLD"
                      ? {
                          label: "Emas",
                          badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
                          Icon: Gem,
                        }
                      : item.type === "PROPERTY"
                        ? {
                            label: "Properti",
                            badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
                            Icon: House,
                          }
                        : {
                            label: "Lainnya",
                            badge: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                            Icon: Layers,
                          };

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{item.name}</div>
                        {item.notes ? (
                          <p className="text-xs text-slate-500 mt-1 max-w-sm truncate">{item.notes}</p>
                        ) : null}
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest ${typeMeta.badge}`}>
                          <typeMeta.Icon className="h-3.5 w-3.5" />
                          {typeMeta.label}
                        </span>
                      </td>
                      <td className="px-8 py-5 font-bold text-slate-700 dark:text-slate-300">
                        Rp {formatGroupedNumber(item.estimatedValue)}
                      </td>
                      <td className="px-8 py-5 text-slate-600 dark:text-slate-300">
                        {item.quantity !== null && item.quantity !== undefined
                          ? `${item.quantity} ${item.unit ?? "unit"}`
                          : "-"}
                      </td>
                      <td className="px-8 py-5 text-slate-600 dark:text-slate-300">
                        {item.acquiredAt ? formatJakartaDate(item.acquiredAt) : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

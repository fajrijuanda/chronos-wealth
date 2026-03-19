import {
  getCollaborationWorkspace,
  setSimulationBaseBoothByEmail,
  setManualBasePrice,
} from "@/actions/collaboration";
import { getActiveUserEmail } from "@/lib/active-user";
import { formatGroupedNumber } from "@/lib/number-format";
import { BoothPackageType } from "@prisma/client";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

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
  const userQuery = `user=${encodeURIComponent(activeEmail)}`;
  const flashOk = typeof sp.ok === "string" ? sp.ok : null;
  const flashError = typeof sp.error === "string" ? sp.error : null;

  async function handleSetBaseBooth(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "");
    const boothId = String(formData.get("boothId") ?? "");

    if (!email || !boothId) {
      redirect(`/assets?${userQuery}&error=${encodeURIComponent("Invalid booth selection")}`);
    }

    try {
      const result = await setSimulationBaseBoothByEmail({ email, boothId });
      redirect(
        `/assets?${userQuery}&ok=${encodeURIComponent(
          `Simulation base price set from ${result.selectedBooth.boothName} (Rp ${formatGroupedNumber(result.selectedBooth.basePrice)})`,
        )}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to set base booth";
      redirect(`/assets?${userQuery}&error=${encodeURIComponent(message)}`);
    }
  }

  async function handleSetManualPrice(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const price = Number(formData.get("price") ?? 0);

    try {
      await setManualBasePrice(email, price);
      redirect(`/assets?${userQuery}&ok=${encodeURIComponent("Manual simulation price updated")}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to update manual price";
      redirect(`/assets?${userQuery}&error=${encodeURIComponent(message)}`);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Assets</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Pilih booth di portofolio untuk dijadikan harga dasar simulasi pembelian booth berikutnya.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <Plus className="w-4 h-4" />
          Add Asset
        </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Current Simulation Base Price</h2>
            <p className="text-4xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
              Rp {formatGroupedNumber(workspace.currentUser.boothBasePrice)}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Nilai ini dipakai sebagai harga acuan di halaman Simulation saat menghitung berapa booth yang bisa ditambah tiap bulan.
            </p>
          </div>
        </div>

        <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-3">Input Manual Price</h2>
          <form action={handleSetManualPrice} className="space-y-4">
            <input type="hidden" name="email" value={workspace.currentUser.email} />
            <div>
              <label className="block text-sm font-medium mb-1 translate-x-1 text-slate-500">Harga Dasar Manual</label>
              <input
                name="price"
                type="number"
                defaultValue={workspace.currentUser.boothBasePrice}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-black/20 px-4 py-2"
                placeholder="7,500,000"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 dark:bg-white dark:text-black text-white px-4 py-2 text-sm font-medium hover:bg-slate-800"
            >
              Update Manual Price
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border border-white/20 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800">
          <h2 className="text-xl font-semibold">Your Booth Portfolio</h2>
          <p className="text-sm text-slate-500 mt-1">
            Setiap paket booth boleh berbeda, dan kamu bisa memilih mana yang jadi harga dasar simulasi (Khusus paket Economy).
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Booth</th>
                <th className="px-6 py-4">Package</th>
                <th className="px-6 py-4">Your Capital</th>
                <th className="px-6 py-4">Expected Monthly Income</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {workspace.portfolio.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Kamu belum punya booth di portofolio.
                  </td>
                </tr>
              ) : (
                workspace.portfolio.map((item) => (
                  <tr key={item.ownershipId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{item.boothName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                        item.packageType === BoothPackageType.EXCLUSIVE 
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400" 
                        : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
                      }`}>
                        {item.packageType === BoothPackageType.EXCLUSIVE ? "Exclusive" : "Economy"}
                      </span>
                    </td>
                    <td className="px-6 py-4">Rp {formatGroupedNumber(item.capitalAmount)}</td>
                    <td className="px-6 py-4">Rp {formatGroupedNumber(item.expectedMonthlyIncome)}</td>
                    <td className="px-6 py-4 text-right">
                      {item.packageType !== BoothPackageType.EXCLUSIVE ? (
                        <form action={handleSetBaseBooth}>
                          <input type="hidden" name="email" value={workspace.currentUser.email} />
                          <input type="hidden" name="boothId" value={item.boothId} />
                          <button
                            type="submit"
                            className="rounded-lg px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                          >
                            Set As Base Price
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not available as base</span>
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

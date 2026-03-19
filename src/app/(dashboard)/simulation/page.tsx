import { simulateCollaborativeGrowth } from "@/actions/simulation";
import { Calculator, Users, TrendingUp, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SimulationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const targetDateStr = typeof sp.date === "string" ? sp.date : "2028-08-01";
  const primaryEmail =
    typeof sp.primary === "string" ? sp.primary : "owner@chronos.local";
  const partnerEmail =
    typeof sp.partner === "string" ? sp.partner : "partner@chronos.local";

  const targetDate = new Date(targetDateStr);
  const simulation = await simulateCollaborativeGrowth({
    targetDate,
    primaryEmail,
    partnerEmail,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Collaborative Booth Simulation</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Simulasi ini memperhitungkan budget per user, jadwal pendapatan per tanggal, dan timing beli booth (awal/akhir bulan).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-6 text-slate-800 dark:text-slate-200">
            <Calculator className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-lg">Simulation Controls</h2>
          </div>

          <form className="space-y-4">
            <div>
              <label htmlFor="sim-target-date" className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Target Date
              </label>
              <input
                id="sim-target-date"
                name="date"
                type="date"
                defaultValue={targetDateStr}
                className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="sim-primary-email" className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Email Kamu
              </label>
              <input
                id="sim-primary-email"
                name="primary"
                type="email"
                defaultValue={primaryEmail}
                className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label htmlFor="sim-partner-email" className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Email Teman
              </label>
              <input
                id="sim-partner-email"
                name="partner"
                type="email"
                defaultValue={partnerEmail}
                className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-6 text-md font-semibold mt-4"
            >
              Run Simulation
            </Button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-linear-to-br from-blue-600 to-indigo-700 p-8 shadow-lg text-white">
            <h3 className="text-blue-100 font-medium mb-2">Combined Projected Income on {targetDate.toLocaleDateString("id-ID")}</h3>
            <p className="text-5xl font-bold tracking-tight">
              Rp {Math.max(0, simulation.combined.totalProjectedIncome).toLocaleString("id-ID")}
            </p>
            <div className="mt-8 pt-6 border-t border-blue-400/30 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-200" />
                Total Booth Equivalent: {simulation.combined.totalBoothEquivalent.toFixed(2)}
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-200" />
                Kalkulasi memperhitungkan cashflow bulanan sebelum dan sesudah tanggal pembelian booth.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {[simulation.primary, simulation.partner].map((user) => (
              <div key={user.userId} className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm">
                <h3 className="text-lg font-semibold mb-1">{user.displayName}</h3>
                <p className="text-xs text-slate-500 mb-4">{user.email}</p>

                <div className="space-y-2 text-sm">
                  <p>Harga Booth: Rp {user.boothPrice.toLocaleString("id-ID")}</p>
                  <p>Budget Bulanan Simulasi: Rp {user.monthlyExpense.toLocaleString("id-ID")}</p>
                  <p>Timing Beli: {user.purchaseTiming === "START_OF_MONTH" ? "Awal Bulan" : "Akhir Bulan"}</p>
                  <p>Booth Equivalent Saat Ini: {user.boothEquivalentOwned.toFixed(2)}</p>
                  <p>Projected Monthly Income: Rp {user.projectedMonthlyIncome.toLocaleString("id-ID")}</p>
                  <p>Target Booth Equivalent: {user.targetBoothEquivalent}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-indigo-500" />
          <h2 className="text-xl font-semibold">Monthly Booth Addition Plan</h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[simulation.primary, simulation.partner].map((user) => (
            <div key={user.userId} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-semibold">{user.displayName} - Rencana Bulanan</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Month</th>
                      <th className="px-3 py-2">Buy Day</th>
                      <th className="px-3 py-2">Add Booth</th>
                      <th className="px-3 py-2">Total Eq.</th>
                      <th className="px-3 py-2">End Cash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {user.plans.map((plan) => (
                      <tr key={`${user.userId}-${plan.month}`}>
                        <td className="px-3 py-2">{plan.month}</td>
                        <td className="px-3 py-2">{plan.purchaseDay}</td>
                        <td className="px-3 py-2 font-semibold text-blue-600">{plan.boothsAdded}</td>
                        <td className="px-3 py-2">{plan.totalBoothsEquivalent.toFixed(2)}</td>
                        <td className="px-3 py-2">Rp {plan.monthEndCash.toLocaleString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import {
  deleteUserAccountByEmail,
  getCollaborationWorkspace,
  setManualBasePrice,
  setUserFinanceProfileByEmail,
  setUserTargetByEmail,
  updateUserEmailByEmail,
} from "@/actions/collaboration";
import { logoutAction } from "@/actions/auth";
import { getActiveUserEmail } from "@/lib/active-user";
import { clearSessionUserEmail, setSessionUserEmail } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { BoothPurchaseTiming } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertTriangle, Flag, Mail, Shield, SlidersHorizontal, UserX } from "lucide-react";
import { formatGroupedNumber } from "@/lib/number-format";

export const dynamic = "force-dynamic";

type TabId = "finance" | "goals" | "session" | "account";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "finance", label: "Finance" },
  { id: "goals", label: "Goals" },
  { id: "session", label: "Session" },
  { id: "account", label: "Account" },
];

function getTabLabel(tab: TabId) {
  return tabs.find((item) => item.id === tab)?.label ?? "Finance";
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const activeEmail = await getActiveUserEmail(typeof sp.user === "string" ? sp.user : undefined);
  if (sp.tab === "connections") {
    redirect("/profile?tab=connections");
  }
  const tabRaw = typeof sp.tab === "string" ? sp.tab : "finance";
  const tab: TabId = tabs.some((item) => item.id === tabRaw) ? (tabRaw as TabId) : "finance";

  const workspace = await getCollaborationWorkspace(activeEmail);
  const currentUser = workspace.currentUser;

  async function saveFinance(formData: FormData) {
    "use server";

    await setUserFinanceProfileByEmail({
      email: activeEmail,
      monthlyExpenseMin: Number(formData.get("monthlyExpenseMin") ?? 0),
      monthlyExpenseMax: Number(formData.get("monthlyExpenseMax") ?? 0),
      purchaseTiming: String(formData.get("purchaseTiming") ?? "END_OF_MONTH") as BoothPurchaseTiming,
      purchaseDayOverride: formData.get("purchaseDayOverride") ? Number(formData.get("purchaseDayOverride")) : null,
      openingBalance: Number(formData.get("openingBalance") ?? 0),
      idleCashTarget: Number(formData.get("idleCashTarget") ?? 1_000_000_000),
      renewEconomyBoothContracts: formData.get("renewEconomyBoothContracts") === "on",
      renewExclusiveBoothContracts: formData.get("renewExclusiveBoothContracts") === "on",
    });

    redirect("/settings?tab=finance&ok=saved");
  }

  async function saveGoals(formData: FormData) {
    "use server";

    const basePrice = Number(formData.get("boothBasePrice") ?? 0);
    const targetBoothEquivalent = Number(formData.get("targetBoothEquivalent") ?? 1);
    const revenuePerBooth = Number(formData.get("revenuePerBooth") ?? 1_000_000);

    await Promise.all([
      setManualBasePrice(activeEmail, basePrice),
      setUserTargetByEmail({ email: activeEmail, targetBoothEquivalent, revenuePerBooth }),
    ]);

    redirect("/settings?tab=goals&ok=saved");
  }

  async function saveAccountEmail(formData: FormData) {
    "use server";

    const nextEmail = String(formData.get("newEmail") ?? "").trim().toLowerCase();
    if (!nextEmail || !nextEmail.includes("@")) {
      redirect("/settings?tab=account&error=validation-error");
    }

    await updateUserEmailByEmail({
      currentEmail: activeEmail,
      newEmail: nextEmail,
    });

    await setSessionUserEmail(nextEmail);
    redirect("/settings?tab=account&ok=email-updated");
  }

  async function deleteAccount(formData: FormData) {
    "use server";

    const confirmText = String(formData.get("confirmText") ?? "").trim();
    if (confirmText !== "DELETE") {
      redirect("/settings?tab=account&error=confirm-delete-required");
    }

    await deleteUserAccountByEmail({ email: activeEmail });
    await clearSessionUserEmail();
    redirect("/login?ok=account-deleted");
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Kelola pengaturan akun, simulasi, target, koneksi, dan sesi aplikasi.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-sm font-medium text-muted-foreground">Section</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="min-w-44 justify-between rounded-2xl">
              {getTabLabel(tab)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52 rounded-2xl">
            {tabs.map((item) => (
              <DropdownMenuItem key={item.id} asChild>
                <Link href={`/settings?tab=${item.id}`} className="flex w-full items-center justify-between">
                  <span>{item.label}</span>
                  {tab === item.id ? <span className="text-xs text-primary">Active</span> : null}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {tab === "finance" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="surface-card p-6 space-y-5 xl:col-span-8">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 rounded-xl bg-sky-100/80 dark:bg-sky-900/35">
              <SlidersHorizontal className="w-5 h-5 text-sky-600 dark:text-sky-300" />
            </div>
            <h2 className="font-display text-xl font-semibold">Simulation Finance</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Expense Range</p>
              <p className="mt-1 text-lg font-semibold">
                Rp {formatGroupedNumber(workspace.financeProfile?.monthlyExpenseMin ?? 0)} - Rp {formatGroupedNumber(workspace.financeProfile?.monthlyExpenseMax ?? 0)}
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Opening Balance</p>
              <p className="mt-1 text-lg font-semibold">Rp {formatGroupedNumber(workspace.financeProfile?.openingBalance ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Idle Cash Target</p>
              <p className="mt-1 text-lg font-semibold">Rp {formatGroupedNumber(workspace.financeProfile?.idleCashTarget ?? 1_000_000_000)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-200/70 bg-sky-50/60 p-4 text-sm text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/25 dark:text-sky-200">
            Atur parameter ini untuk mempengaruhi simulasi cashflow bulanan dan ritme pembelian booth.
          </div>

          <form action={saveFinance} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="settings-monthly-expense-min" className="text-sm font-medium">Min Monthly Expense</label>
                <input id="settings-monthly-expense-min" name="monthlyExpenseMin" type="number" defaultValue={workspace.financeProfile?.monthlyExpenseMin ?? 0} className="w-full rounded-2xl border border-input bg-white/70 dark:bg-slate-900/35 px-4 py-2" />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-monthly-expense-max" className="text-sm font-medium">Max Monthly Expense</label>
                <input id="settings-monthly-expense-max" name="monthlyExpenseMax" type="number" defaultValue={workspace.financeProfile?.monthlyExpenseMax ?? 0} className="w-full rounded-2xl border border-input bg-white/70 dark:bg-slate-900/35 px-4 py-2" />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-purchase-timing" className="text-sm font-medium">Purchase Timing</label>
                <SelectField
                  id="settings-purchase-timing"
                  name="purchaseTiming"
                  defaultValue={workspace.financeProfile?.purchaseTiming ?? BoothPurchaseTiming.END_OF_MONTH}
                  options={[
                    { value: BoothPurchaseTiming.START_OF_MONTH, label: "Start of Month" },
                    { value: BoothPurchaseTiming.END_OF_MONTH, label: "End of Month" },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-purchase-day-override" className="text-sm font-medium">Purchase Day Override</label>
                <input id="settings-purchase-day-override" name="purchaseDayOverride" type="number" min={1} max={31} defaultValue={workspace.financeProfile?.purchaseDayOverride ?? ""} className="w-full rounded-2xl border border-input bg-white/70 dark:bg-slate-900/35 px-4 py-2" />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-opening-balance" className="text-sm font-medium">Opening Balance</label>
                <input id="settings-opening-balance" name="openingBalance" type="number" defaultValue={workspace.financeProfile?.openingBalance ?? 0} className="w-full rounded-2xl border border-input bg-white/70 dark:bg-slate-900/35 px-4 py-2" />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-idle-cash-target" className="text-sm font-medium">Idle Cash Target</label>
                <input id="settings-idle-cash-target" name="idleCashTarget" type="number" defaultValue={workspace.financeProfile?.idleCashTarget ?? 1_000_000_000} className="w-full rounded-2xl border border-input bg-white/70 dark:bg-slate-900/35 px-4 py-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 rounded-2xl border border-border px-4 py-3">
                <input name="renewEconomyBoothContracts" type="checkbox" defaultChecked={workspace.financeProfile?.renewEconomyBoothContracts ?? true} />
                <span className="text-sm">Auto renew economy contracts</span>
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-border px-4 py-3">
                <input name="renewExclusiveBoothContracts" type="checkbox" defaultChecked={workspace.financeProfile?.renewExclusiveBoothContracts ?? true} />
                <span className="text-sm">Auto renew exclusive contracts</span>
              </label>
            </div>

            <Button type="submit">Save Finance Settings</Button>
          </form>
          </div>

          <div className="space-y-4 xl:col-span-4">
            <div className="surface-card-soft p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Purchase Mode</p>
              <p className="mt-1 text-lg font-semibold">{workspace.financeProfile?.purchaseTiming ?? BoothPurchaseTiming.END_OF_MONTH}</p>
            </div>
            <div className="surface-card-soft p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Renewal Policy</p>
              <p className="mt-1 text-sm">Economy: {workspace.financeProfile?.renewEconomyBoothContracts ? "Auto" : "Manual"}</p>
              <p className="text-sm">Exclusive: {workspace.financeProfile?.renewExclusiveBoothContracts ? "Auto" : "Manual"}</p>
            </div>
            <div className="surface-card-soft p-4 text-sm text-muted-foreground">
              Gunakan rentang expense realistis agar proyeksi simulation tidak terlalu agresif.
            </div>
          </div>
        </div>
      ) : null}

      {tab === "goals" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="surface-card p-6 space-y-5 xl:col-span-8">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 rounded-xl bg-amber-100/80 dark:bg-amber-900/35">
              <Flag className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            </div>
            <h2 className="font-display text-xl font-semibold">Portfolio & Target Goals</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Booth Base Price</p>
              <p className="mt-1 text-lg font-semibold">Rp {formatGroupedNumber(workspace.currentUser.boothBasePrice)}</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Monthly Target Income</p>
              <p className="mt-1 text-lg font-semibold">Rp {formatGroupedNumber(workspace.targetProgress.targetIncome ?? 0)}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-200">
            Sesuaikan target booth equivalent dan revenue per booth untuk menjaga milestone pertumbuhan tetap realistis.
          </div>

          <form action={saveGoals} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="settings-booth-base-price" className="text-sm font-medium">Booth Base Price</label>
              <input id="settings-booth-base-price" name="boothBasePrice" type="number" min={0} defaultValue={workspace.currentUser.boothBasePrice} className="w-full rounded-2xl border border-input bg-white/70 dark:bg-slate-900/35 px-4 py-2" />
            </div>
            <div className="space-y-2">
              <label htmlFor="settings-target-booth-equivalent" className="text-sm font-medium">Target Booth Equivalent</label>
              <input id="settings-target-booth-equivalent" name="targetBoothEquivalent" type="number" min={1} defaultValue={workspace.targetProgress.targetBoothEquivalent || 1} className="w-full rounded-2xl border border-input bg-white/70 dark:bg-slate-900/35 px-4 py-2" />
            </div>
            <div className="space-y-2">
              <label htmlFor="settings-revenue-per-booth" className="text-sm font-medium">Revenue per Booth</label>
              <input id="settings-revenue-per-booth" name="revenuePerBooth" type="number" min={1} defaultValue={workspace.targetProgress.revenuePerBooth || 1_000_000} className="w-full rounded-2xl border border-input bg-white/70 dark:bg-slate-900/35 px-4 py-2" />
            </div>
            <Button type="submit">Save Goal Settings</Button>
          </form>
          </div>

          <div className="space-y-4 xl:col-span-4">
            <div className="surface-card-soft p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Booth Equivalent Achieved</p>
              <p className="mt-1 text-2xl font-semibold">{workspace.targetProgress.boothEquivalentAchieved.toFixed(2)}</p>
            </div>
            <div className="surface-card-soft p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Progress</p>
              <p className="mt-1 text-lg font-semibold">{workspace.targetProgress.progressPct.toFixed(1)}%</p>
              <progress
                value={Math.min(100, workspace.targetProgress.progressPct)}
                max={100}
                className="mt-2 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-200 dark:[&::-webkit-progress-bar]:bg-slate-800 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-linear-to-r [&::-webkit-progress-value]:from-indigo-500 [&::-webkit-progress-value]:to-violet-500 [&::-moz-progress-bar]:bg-linear-to-r [&::-moz-progress-bar]:from-indigo-500 [&::-moz-progress-bar]:to-violet-500"
              />
            </div>
            <div className="surface-card-soft p-4 text-sm text-muted-foreground">
              Review target secara berkala agar arah pertumbuhan tetap sehat dan terukur.
            </div>
          </div>
        </div>
      ) : null}

      {tab === "session" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="surface-card p-6 space-y-5 xl:col-span-8">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 rounded-xl bg-rose-100/80 dark:bg-rose-900/35">
              <Shield className="w-5 h-5 text-rose-600 dark:text-rose-300" />
            </div>
            <h2 className="font-display text-xl font-semibold">Session & Security</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active Session</p>
              <p className="mt-1 text-lg font-semibold">1 Device</p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Account Status</p>
              <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">Secure</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Current signed-in email</p>
            <p className="font-semibold mt-1">{currentUser.email}</p>
          </div>

          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/60 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-200">
            Logout akan menghapus sesi aktif di browser ini. Pastikan data perubahan sudah tersimpan sebelum keluar.
          </div>

          <form action={logoutAction}>
            <Button type="submit" variant="destructive">Logout Now</Button>
          </form>
          </div>

          <div className="space-y-4 xl:col-span-4">
            <div className="surface-card-soft p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Auth Email</p>
              <p className="mt-1 break-all text-sm font-semibold">{currentUser.email}</p>
            </div>
            <div className="surface-card-soft p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Need Connection Management?</p>
              <Link href="/profile?tab=connections" className="mt-1 inline-flex text-sm font-semibold text-primary hover:underline">
                Open Connections in Profile
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "account" ? (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="surface-card p-6 space-y-6 xl:col-span-8">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="p-2 rounded-xl bg-indigo-100/80 dark:bg-indigo-900/35">
                <Mail className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
              </div>
              <h2 className="font-display text-xl font-semibold">Account Management</h2>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card/70 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Email</p>
              <p className="mt-1 break-all text-sm font-semibold">{currentUser.email}</p>
            </div>

            <form action={saveAccountEmail} className="space-y-3 rounded-2xl border border-border/80 bg-card/70 p-4">
              <h3 className="text-base font-semibold">Change Email</h3>
              <p className="text-sm text-muted-foreground">Gunakan email aktif yang valid. Sesi Anda akan dipindah ke email baru.</p>
              <div className="space-y-2">
                <label htmlFor="settings-new-email" className="text-sm font-medium">New Email</label>
                <input
                  id="settings-new-email"
                  name="newEmail"
                  type="email"
                  required
                  placeholder="nama@email.com"
                  className="w-full rounded-2xl border border-input bg-white/70 dark:bg-slate-900/35 px-4 py-2"
                />
              </div>
              <Button type="submit">Update Email</Button>
            </form>

            <form action={deleteAccount} className="space-y-3 rounded-2xl border border-rose-200/80 bg-rose-50/60 p-4 dark:border-rose-900/60 dark:bg-rose-950/25">
              <h3 className="flex items-center gap-2 text-base font-semibold text-rose-700 dark:text-rose-300">
                <UserX className="h-4 w-4" /> Delete Account
              </h3>
              <p className="text-sm text-rose-700/90 dark:text-rose-200">
                Aksi ini permanen. Ketik <strong>DELETE</strong> untuk konfirmasi penghapusan akun.
              </p>
              <div className="space-y-2">
                <label htmlFor="settings-confirm-delete" className="text-sm font-medium text-rose-700 dark:text-rose-300">Confirmation Text</label>
                <input
                  id="settings-confirm-delete"
                  name="confirmText"
                  type="text"
                  required
                  placeholder="DELETE"
                  className="w-full rounded-2xl border border-rose-300/80 bg-white/80 px-4 py-2 dark:border-rose-800 dark:bg-slate-900/35"
                />
              </div>
              <Button type="submit" variant="destructive">Delete My Account</Button>
            </form>
          </div>

          <div className="space-y-4 xl:col-span-4">
            <div className="surface-card-soft p-4 text-sm text-muted-foreground">
              Ganti email hanya jika Anda masih memiliki akses ke email baru untuk login berikutnya.
            </div>
            <div className="surface-card-soft p-4 text-sm text-rose-700 dark:text-rose-300">
              <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Danger Zone</p>
              <p className="mt-2 text-muted-foreground dark:text-rose-200/90">
                Penghapusan akun akan menghapus data profil, koneksi, target, dan data terkait akun ini.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

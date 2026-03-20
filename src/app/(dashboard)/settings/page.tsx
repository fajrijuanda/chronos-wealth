import {
  getCollaborationWorkspace,
  getUserConnectionDirectoryByEmail,
  respondFriendRequest,
  sendFriendRequestByEmail,
  setManualBasePrice,
  setUserFinanceProfileByEmail,
  setUserTargetByEmail,
} from "@/actions/collaboration";
import { logoutAction } from "@/actions/auth";
import { getActiveUserEmail } from "@/lib/active-user";
import { redirect } from "next/navigation";
import { BoothPurchaseTiming } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField } from "@/components/ui/select-field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SlidersHorizontal, Flag, Users, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

type TabId = "finance" | "goals" | "connections" | "session";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "finance", label: "Finance" },
  { id: "goals", label: "Goals" },
  { id: "connections", label: "Connections" },
  { id: "session", label: "Session" },
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
  const tabRaw = typeof sp.tab === "string" ? sp.tab : "finance";
  const tab: TabId = tabs.some((item) => item.id === tabRaw) ? (tabRaw as TabId) : "finance";

  const [{ currentUser, directory }, workspace] = await Promise.all([
    getUserConnectionDirectoryByEmail(activeEmail),
    getCollaborationWorkspace(activeEmail),
  ]);

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

  async function connectUser(formData: FormData) {
    "use server";

    const requesterEmail = String(formData.get("requesterEmail") ?? "");
    const addresseeEmail = String(formData.get("addresseeEmail") ?? "");

    await sendFriendRequestByEmail({ requesterEmail, addresseeEmail });
    redirect("/settings?tab=connections&ok=request-sent");
  }

  async function respondConnection(formData: FormData) {
    "use server";

    const friendshipId = String(formData.get("friendshipId") ?? "");
    const actionRaw = String(formData.get("action") ?? "reject");
    const action = actionRaw === "accept" ? "accept" : "reject";

    await respondFriendRequest(friendshipId, action);
    redirect(`/settings?tab=connections&ok=${action}`);
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
        <div className="surface-card p-6 space-y-5 max-w-4xl">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 rounded-xl bg-sky-100/80 dark:bg-sky-900/35">
              <SlidersHorizontal className="w-5 h-5 text-sky-600 dark:text-sky-300" />
            </div>
            <h2 className="font-display text-xl font-semibold">Simulation Finance</h2>
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
      ) : null}

      {tab === "goals" ? (
        <div className="surface-card p-6 space-y-5 max-w-3xl">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 rounded-xl bg-amber-100/80 dark:bg-amber-900/35">
              <Flag className="w-5 h-5 text-amber-600 dark:text-amber-300" />
            </div>
            <h2 className="font-display text-xl font-semibold">Portfolio & Target Goals</h2>
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
      ) : null}

      {tab === "connections" ? (
        <div className="surface-card p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 rounded-xl bg-violet-100/80 dark:bg-violet-900/35">
              <Users className="w-5 h-5 text-violet-600 dark:text-violet-300" />
            </div>
            <h2 className="font-display text-xl font-semibold">Connections</h2>
          </div>

          <div className="space-y-3">
            {directory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada user lain yang bisa dihubungkan.</p>
            ) : (
              directory.map((entry: {
                user: { id: string; email: string; displayName: string };
                relationship: "NONE" | "PENDING_OUT" | "PENDING_IN" | "ACCEPTED" | "REJECTED" | "BLOCKED";
                friendshipId: string | null;
              }) => (
                <div key={entry.user.id} className="rounded-2xl border border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <Link href={`/profile/${encodeURIComponent(entry.user.email)}`} className="font-semibold text-foreground hover:underline">
                      {entry.user.displayName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{entry.user.email}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.relationship === "NONE" ? (
                      <form action={connectUser}>
                        <input type="hidden" name="requesterEmail" value={currentUser.email} />
                        <input type="hidden" name="addresseeEmail" value={entry.user.email} />
                        <Button type="submit" size="sm">Connect</Button>
                      </form>
                    ) : null}

                    {entry.relationship === "PENDING_OUT" ? (
                      <Badge variant="outline">Pending Approval</Badge>
                    ) : null}

                    {entry.relationship === "PENDING_IN" && entry.friendshipId ? (
                      <>
                        <form action={respondConnection}>
                          <input type="hidden" name="friendshipId" value={entry.friendshipId} />
                          <input type="hidden" name="action" value="accept" />
                          <Button type="submit" size="sm">Accept</Button>
                        </form>
                        <form action={respondConnection}>
                          <input type="hidden" name="friendshipId" value={entry.friendshipId} />
                          <input type="hidden" name="action" value="reject" />
                          <Button type="submit" size="sm" variant="outline">Reject</Button>
                        </form>
                      </>
                    ) : null}

                    {entry.relationship === "ACCEPTED" ? (
                      <Badge variant="outline">Connected</Badge>
                    ) : null}

                    {entry.relationship === "REJECTED" ? (
                      <Badge variant="outline">Rejected</Badge>
                    ) : null}

                    {entry.relationship === "BLOCKED" ? (
                      <Badge variant="outline">Blocked</Badge>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {tab === "session" ? (
        <div className="surface-card p-6 max-w-2xl space-y-5">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <div className="p-2 rounded-xl bg-rose-100/80 dark:bg-rose-900/35">
              <Shield className="w-5 h-5 text-rose-600 dark:text-rose-300" />
            </div>
            <h2 className="font-display text-xl font-semibold">Session & Security</h2>
          </div>

          <div className="rounded-2xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Current signed-in email</p>
            <p className="font-semibold mt-1">{currentUser.email}</p>
          </div>

          <form action={logoutAction}>
            <Button type="submit" variant="destructive">Logout Now</Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

import {
  BoothPurchaseTiming,
  BoothPackageType,
  CategoryType,
  BoothSelectionType,
  ProposalStatus,
} from "@prisma/client";
import {
  createJointBoothProposalByEmail,
  getCollaborationWorkspace,
  respondFriendRequest,
  reviewJointBoothProposal,
  sendFriendRequestByEmail,
  setUserFinanceProfileByEmail,
  setUserTargetByEmail,
} from "@/actions/collaboration";
import { createIncomeSourceByEmail } from "@/actions/income";
import { getActiveUserEmail } from "@/lib/active-user";
import { redirect } from "next/navigation";

export default async function CollaborationPage({
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

  async function handleAddFriend(formData: FormData) {
    "use server";

    const requesterEmail = String(formData.get("requesterEmail") ?? "");
    const addresseeEmail = String(formData.get("addresseeEmail") ?? "");
    const partnerBasePrice = Number(formData.get("addresseeBoothBasePrice") ?? 0);

    try {
      await sendFriendRequestByEmail({
        requesterEmail,
        addresseeEmail,
        addresseeBoothBasePrice: partnerBasePrice > 0 ? partnerBasePrice : undefined,
      });
      redirect(`/collaboration?${userQuery}&ok=${encodeURIComponent("Friend request sent")}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to send friend request";
      redirect(`/collaboration?${userQuery}&error=${encodeURIComponent(message)}`);
    }
  }

  async function handleRespondFriendRequest(formData: FormData) {
    "use server";

    const friendshipId = String(formData.get("friendshipId") ?? "");
    const action = String(formData.get("action") ?? "reject");

    if (!friendshipId || (action !== "accept" && action !== "reject")) {
      redirect(`/collaboration?${userQuery}&error=${encodeURIComponent("Invalid friendship action")}`);
    }

    try {
      await respondFriendRequest(friendshipId, action);
      redirect(`/collaboration?${userQuery}&ok=${encodeURIComponent(`Friend request ${action}ed`)}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to update friendship";
      redirect(`/collaboration?${userQuery}&error=${encodeURIComponent(message)}`);
    }
  }

  async function handleProposal(formData: FormData) {
    "use server";

    const requesterEmail = String(formData.get("requesterEmail") ?? "");
    const partnerEmail = String(formData.get("partnerEmail") ?? "");
    const boothName = String(formData.get("boothName") ?? "");
    const boothPrice = Number(formData.get("boothPrice") ?? 0);
    const requesterAvailableBalance = Number(
      formData.get("requesterAvailableBalance") ?? 0,
    );
    const partnerBoothPrice = Number(formData.get("partnerBoothPrice") ?? 0);
    const expectedMonthlyIncome = Number(formData.get("expectedMonthlyIncome") ?? 0);
    const packageTypeRaw = String(formData.get("packageType") ?? BoothPackageType.ECONOMY);
    const mouSignedAtRaw = String(formData.get("mouSignedAt") ?? "");
    const referralEconomyBooths = Number(formData.get("referralEconomyBooths") ?? 0);
    const selection = String(formData.get("selectedBoothType") ?? "NEW_BOOTH");
    const notes = String(formData.get("notes") ?? "");

    const selectedBoothType =
      selection === BoothSelectionType.EXISTING_BOOTH
        ? BoothSelectionType.EXISTING_BOOTH
        : BoothSelectionType.NEW_BOOTH;

    const packageType =
      packageTypeRaw === BoothPackageType.EXCLUSIVE
        ? BoothPackageType.EXCLUSIVE
        : BoothPackageType.ECONOMY;

    if (packageType === BoothPackageType.EXCLUSIVE) {
      if (boothPrice + partnerBoothPrice < 20_000_000) {
        redirect(
          `/collaboration?${userQuery}&error=${encodeURIComponent(
            "Exclusive package requires total capital at least Rp 20.000.000",
          )}`,
        );
      }

      if (referralEconomyBooths > 0) {
        redirect(
          `/collaboration?${userQuery}&error=${encodeURIComponent(
            "Referral economy commission only applies to economy package",
          )}`,
        );
      }
    }

    try {
      const result = await createJointBoothProposalByEmail({
        requesterEmail,
        partnerEmail,
        boothName,
        boothPrice,
        requesterAvailableBalance,
        partnerBoothPrice,
        expectedMonthlyIncome,
        packageType,
        mouSignedAt: mouSignedAtRaw ? new Date(mouSignedAtRaw) : undefined,
        referralEconomyBooths,
        selectedBoothType,
        notes: notes || undefined,
      });

      const message =
        result.mode === "SELF_PURCHASE"
          ? "Booth purchased as fully owned"
          : "Collaboration proposal submitted";

      redirect(`/collaboration?${userQuery}&ok=${encodeURIComponent(message)}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to process booth purchase";
      redirect(`/collaboration?${userQuery}&error=${encodeURIComponent(message)}`);
    }
  }

  async function handleReviewProposal(formData: FormData) {
    "use server";

    const proposalId = String(formData.get("proposalId") ?? "");
    const reviewerUserId = String(formData.get("reviewerUserId") ?? "");
    const decision = String(formData.get("decision") ?? "reject");
    const reviewerNote = String(formData.get("reviewerNote") ?? "");

    if (!proposalId || !reviewerUserId) {
      redirect(`/collaboration?${userQuery}&error=${encodeURIComponent("Invalid proposal action")}`);
    }

    try {
      await reviewJointBoothProposal({
        proposalId,
        reviewerUserId,
        approve: decision === "approve",
        reviewerNote: reviewerNote || undefined,
      });

      redirect(`/collaboration?${userQuery}&ok=${encodeURIComponent(`Proposal ${decision}d`)}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to review proposal";
      redirect(`/collaboration?${userQuery}&error=${encodeURIComponent(message)}`);
    }
  }

  async function handleSetTarget(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "");
    const targetBoothEquivalent = Number(formData.get("targetBoothEquivalent") ?? 0);
    const revenuePerBooth = Number(formData.get("revenuePerBooth") ?? 0);

    try {
      await setUserTargetByEmail({
        email,
        targetBoothEquivalent,
        revenuePerBooth: revenuePerBooth > 0 ? revenuePerBooth : undefined,
      });
      redirect(`/collaboration?${userQuery}&ok=${encodeURIComponent("Target updated")}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to update target";
      redirect(`/collaboration?${userQuery}&error=${encodeURIComponent(message)}`);
    }
  }

  async function handleSetFinanceProfile(formData: FormData) {
    "use server";

    const email = String(formData.get("email") ?? "");
    const monthlyExpenseMin = Number(formData.get("monthlyExpenseMin") ?? 0);
    const monthlyExpenseMax = Number(formData.get("monthlyExpenseMax") ?? 0);
    const openingBalance = Number(formData.get("openingBalance") ?? 0);
    const idleCashTarget = Number(formData.get("idleCashTarget") ?? 0);
    const holdingCapitalTarget = Number(formData.get("holdingCapitalTarget") ?? 0);
    const holdingContributionPct = Number(formData.get("holdingContributionPct") ?? 0);
    const holdingLaunchDateRaw = String(formData.get("holdingLaunchDate") ?? "");
    const pt2BuildCapitalTarget = Number(formData.get("pt2BuildCapitalTarget") ?? 0);
    const pt2ContributionPct = Number(formData.get("pt2ContributionPct") ?? 0);
    const pt2LaunchDateRaw = String(formData.get("pt2LaunchDate") ?? "");
    const renewEconomyBoothContracts =
      String(formData.get("renewEconomyBoothContracts") ?? "").toLowerCase() === "on";
    const renewExclusiveBoothContracts =
      String(formData.get("renewExclusiveBoothContracts") ?? "").toLowerCase() === "on";
    const purchaseTimingRaw = String(
      formData.get("purchaseTiming") ?? BoothPurchaseTiming.START_OF_MONTH,
    );
    const purchaseDayRaw = Number(formData.get("purchaseDayOverride") ?? 0);

    const purchaseTiming =
      purchaseTimingRaw === BoothPurchaseTiming.END_OF_MONTH
        ? BoothPurchaseTiming.END_OF_MONTH
        : BoothPurchaseTiming.START_OF_MONTH;

    try {
      await setUserFinanceProfileByEmail({
        email,
        monthlyExpenseMin,
        monthlyExpenseMax,
        openingBalance,
        idleCashTarget,
        holdingCapitalTarget,
        holdingContributionPct,
        holdingLaunchDate: holdingLaunchDateRaw ? new Date(holdingLaunchDateRaw) : undefined,
        pt2BuildCapitalTarget,
        pt2ContributionPct,
        pt2LaunchDate: pt2LaunchDateRaw ? new Date(pt2LaunchDateRaw) : undefined,
        renewEconomyBoothContracts,
        renewExclusiveBoothContracts,
        purchaseTiming,
        purchaseDayOverride: purchaseDayRaw > 0 ? purchaseDayRaw : null,
      });
      redirect(`/collaboration?${userQuery}&ok=${encodeURIComponent("Finance profile updated")}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to update finance profile";
      redirect(`/collaboration?${userQuery}&error=${encodeURIComponent(message)}`);
    }
  }

  async function handleAddIncomeSchedule(formData: FormData) {
    "use server";

    const ownerEmail = String(formData.get("ownerEmail") ?? "");
    const name = String(formData.get("incomeName") ?? "");
    const amount = Number(formData.get("incomeAmount") ?? 0);
    const payoutDateRaw = Number(formData.get("incomePayoutDate") ?? 1);
    const isRecurring =
      String(formData.get("incomeIsRecurring") ?? "").toLowerCase() === "on";
    const expectedDateRaw = String(formData.get("incomeExpectedDate") ?? "");
    const categoryRaw = String(formData.get("incomeCategory") ?? "SALARY");

    const allowedCategories = new Set<CategoryType>([
      CategoryType.SALARY,
      CategoryType.PROJECT,
      CategoryType.COMMISSION,
      CategoryType.SAAS,
      CategoryType.BOOTH,
      CategoryType.STOCK,
    ]);

    const category = allowedCategories.has(categoryRaw as CategoryType)
      ? (categoryRaw as CategoryType)
      : CategoryType.SALARY;

    try {
      await createIncomeSourceByEmail({
        ownerEmail,
        name,
        amount,
        payoutDate: isRecurring ? payoutDateRaw : null,
        expectedDate: !isRecurring && expectedDateRaw ? new Date(expectedDateRaw) : null,
        isRecurring,
        category,
      });
      redirect(`/collaboration?${userQuery}&ok=${encodeURIComponent("Income schedule saved")}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to save income schedule";
      redirect(`/collaboration?${userQuery}&error=${encodeURIComponent(message)}`);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Collaboration Booth</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Active user: <span className="font-semibold">{workspace.currentUser.email}</span>
        </p>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Set Personal Booth Target</h2>
          <p className="text-sm text-slate-500 mb-4">
            Example: target 300 booth = Rp 300.000.000 if revenue per booth is Rp 1.000.000.
          </p>

          <form action={handleSetTarget} className="space-y-3">
            <input type="hidden" name="email" value={workspace.currentUser.email} />
            <label htmlFor="target-booth-equivalent" className="block text-sm font-medium">Target Booth Equivalent</label>
            <input
              id="target-booth-equivalent"
              name="targetBoothEquivalent"
              type="number"
              min={1}
              defaultValue={workspace.targetProgress.targetBoothEquivalent || 300}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            />
            <label htmlFor="revenue-per-booth" className="block text-sm font-medium">Revenue Per Booth (Rp)</label>
            <input
              id="revenue-per-booth"
              name="revenuePerBooth"
              type="number"
              min={1}
              defaultValue={workspace.targetProgress.revenuePerBooth || 1_000_000}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            />
            <button className="rounded-xl px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700" type="submit">
              Save Target
            </button>
          </form>

          <div className="mt-5 text-sm text-slate-600 dark:text-slate-300 space-y-1">
            <p>Target Income: Rp {workspace.targetProgress.targetIncome.toLocaleString("id-ID")}</p>
            <p>Current Monthly Share: Rp {workspace.targetProgress.monthlyIncomeShare.toLocaleString("id-ID")}</p>
            <p>Booth Equivalent Achieved: {workspace.targetProgress.boothEquivalentAchieved.toFixed(2)}</p>
            <p>Progress: {workspace.targetProgress.progressPct.toFixed(2)}%</p>
          </div>
        </div>

        <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Finance Profile for Simulation</h2>
          <form action={handleSetFinanceProfile} className="space-y-3 mb-6">
            <input type="hidden" name="email" value={workspace.currentUser.email} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="expense-min" className="block text-sm font-medium">Expense Min (Rp)</label>
                <input
                  id="expense-min"
                  name="monthlyExpenseMin"
                  type="number"
                  min={0}
                  defaultValue={workspace.financeProfile?.monthlyExpenseMin ?? 1_000_000}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="expense-max" className="block text-sm font-medium">Expense Max (Rp)</label>
                <input
                  id="expense-max"
                  name="monthlyExpenseMax"
                  type="number"
                  min={0}
                  defaultValue={workspace.financeProfile?.monthlyExpenseMax ?? 1_000_000}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="idle-cash-target" className="block text-sm font-medium">Idle Cash Target (Rp)</label>
                <input
                  id="idle-cash-target"
                  name="idleCashTarget"
                  type="number"
                  min={0}
                  defaultValue={workspace.financeProfile?.idleCashTarget ?? 1_000_000_000}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="holding-capital-target" className="block text-sm font-medium">Holding Total Capital (Rp)</label>
                <input
                  id="holding-capital-target"
                  name="holdingCapitalTarget"
                  type="number"
                  min={0}
                  defaultValue={workspace.financeProfile?.holdingCapitalTarget ?? 1_500_000_000}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="holding-contribution-pct" className="block text-sm font-medium">Your Holding Share (%)</label>
                <input
                  id="holding-contribution-pct"
                  name="holdingContributionPct"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={workspace.financeProfile?.holdingContributionPct ?? 50}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="holding-launch-date" className="block text-sm font-medium">Holding Launch Date</label>
                <input
                  id="holding-launch-date"
                  name="holdingLaunchDate"
                  type="date"
                  defaultValue={workspace.financeProfile?.holdingLaunchDate ? new Date(workspace.financeProfile.holdingLaunchDate).toISOString().slice(0, 10) : "2028-07-01"}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="pt2-build-capital-target" className="block text-sm font-medium">PT 2 Build Target (Rp)</label>
                <input
                  id="pt2-build-capital-target"
                  name="pt2BuildCapitalTarget"
                  type="number"
                  min={0}
                  defaultValue={workspace.financeProfile?.pt2BuildCapitalTarget ?? 8_000_000_000}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="pt2-contribution-pct" className="block text-sm font-medium">Your PT 2 Urunan Share (%)</label>
                <input
                  id="pt2-contribution-pct"
                  name="pt2ContributionPct"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={workspace.financeProfile?.pt2ContributionPct ?? 50}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pt2-launch-date" className="block text-sm font-medium">PT 2 Build Target Date</label>
              <input
                id="pt2-launch-date"
                name="pt2LaunchDate"
                type="date"
                defaultValue={workspace.financeProfile?.pt2LaunchDate ? new Date(workspace.financeProfile.pt2LaunchDate).toISOString().slice(0, 10) : "2030-01-01"}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="renewEconomyBoothContracts"
                defaultChecked={workspace.financeProfile?.renewEconomyBoothContracts ?? true}
              />
              Auto-renew booth ekonomi after 2 years (reinvest returned capital)
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="renewExclusiveBoothContracts"
                defaultChecked={workspace.financeProfile?.renewExclusiveBoothContracts ?? true}
              />
              Auto-renew booth exclusive every 4 years (capital top-up)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="opening-balance" className="block text-sm font-medium">Opening Balance (Rp)</label>
                <input
                  id="opening-balance"
                  name="openingBalance"
                  type="number"
                  min={0}
                  defaultValue={workspace.financeProfile?.openingBalance ?? 0}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="purchase-timing" className="block text-sm font-medium">Purchase Timing</label>
                <select
                  id="purchase-timing"
                  name="purchaseTiming"
                  defaultValue={workspace.financeProfile?.purchaseTiming ?? BoothPurchaseTiming.START_OF_MONTH}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                >
                  <option value={BoothPurchaseTiming.START_OF_MONTH}>Start of Month</option>
                  <option value={BoothPurchaseTiming.END_OF_MONTH}>End of Month</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="purchase-day-override" className="block text-sm font-medium">Purchase Day Override (1-31, optional)</label>
              <input
                id="purchase-day-override"
                name="purchaseDayOverride"
                type="number"
                min={1}
                max={31}
                defaultValue={workspace.financeProfile?.purchaseDayOverride ?? ""}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
              />
            </div>
            <button className="rounded-xl px-4 py-2 bg-indigo-700 text-white hover:bg-indigo-800" type="submit">
              Save Finance Profile
            </button>
          </form>

          <h2 className="text-xl font-semibold mb-4">Add Friend</h2>
          <form action={handleAddFriend} className="space-y-3">
            <input type="hidden" name="requesterEmail" value={workspace.currentUser.email} />
            <label htmlFor="friend-email" className="block text-sm font-medium">Friend Email</label>
            <input
              id="friend-email"
              name="addresseeEmail"
              type="email"
              placeholder="teman@domain.com"
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            />
            <label htmlFor="friend-booth-price" className="block text-sm font-medium">Friend Booth Price (Rp)</label>
            <input
              id="friend-booth-price"
              name="addresseeBoothBasePrice"
              type="number"
              min={1}
              defaultValue={9_500_000}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            />
            <button className="rounded-xl px-4 py-2 bg-blue-600 text-white hover:bg-blue-700" type="submit">
              Send Request
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {workspace.friendships.length === 0 && (
              <p className="text-sm text-slate-500">No friendship records yet.</p>
            )}
            {workspace.friendships.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p>
                    {item.friend.displayName} ({item.friend.email})
                  </p>
                  <span className="text-xs font-semibold">{item.status}</span>
                </div>
                {item.canRespond && (
                  <form action={handleRespondFriendRequest} className="mt-2 flex gap-2">
                    <input type="hidden" name="friendshipId" value={item.id} />
                    <button name="action" value="accept" className="rounded-md px-3 py-1 text-xs bg-emerald-600 text-white" type="submit">
                      Accept
                    </button>
                    <button name="action" value="reject" className="rounded-md px-3 py-1 text-xs bg-rose-600 text-white" type="submit">
                      Reject
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-slate-200/70 dark:border-slate-800 pt-5">
            <h3 className="font-semibold mb-2">Add Income Schedule</h3>
            <p className="text-xs text-slate-500 mb-3">Catat tanggal pendapatan bulanan per user, misalnya gajian tanggal 1 atau 30.</p>
            <form action={handleAddIncomeSchedule} className="space-y-3">
              <input type="hidden" name="ownerEmail" value={workspace.currentUser.email} />
              <div>
                <label htmlFor="income-name" className="block text-sm font-medium">Income Name</label>
                <input
                  id="income-name"
                  name="incomeName"
                  type="text"
                  defaultValue="Salary"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="income-category" className="block text-sm font-medium">Category</label>
                  <select
                    id="income-category"
                    name="incomeCategory"
                    defaultValue="SALARY"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                  >
                    <option value="SALARY">Salary</option>
                    <option value="PROJECT">Freelance / Project</option>
                    <option value="COMMISSION">Commission</option>
                    <option value="SAAS">SaaS</option>
                    <option value="BOOTH">Booth</option>
                    <option value="STOCK">Saham (aktif setelah Holding Launch)</option>
                  </select>
                </div>
                <label className="inline-flex items-center gap-2 text-sm mt-6">
                  <input type="checkbox" name="incomeIsRecurring" defaultChecked />
                  Recurring income
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="income-amount" className="block text-sm font-medium">Amount (Rp)</label>
                  <input
                    id="income-amount"
                    name="incomeAmount"
                    type="number"
                    min={1}
                    defaultValue={5_000_000}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="income-day" className="block text-sm font-medium">Payout Day</label>
                  <input
                    id="income-day"
                    name="incomePayoutDate"
                    type="number"
                    min={1}
                    max={31}
                    defaultValue={1}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="income-expected-date" className="block text-sm font-medium">Expected Date (for non-recurring)</label>
                <input
                  id="income-expected-date"
                  name="incomeExpectedDate"
                  type="date"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
                />
              </div>
              <button className="rounded-xl px-4 py-2 bg-slate-700 text-white hover:bg-slate-800" type="submit">
                Save Income Schedule
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Propose Booth Purchase / Joint Venture</h2>
        <p className="text-sm text-slate-500 mb-4">
          If your balance is below booth price, system creates a collaboration proposal automatically.
        </p>

        <form action={handleProposal} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="hidden" name="requesterEmail" value={workspace.currentUser.email} />

          <div>
            <label htmlFor="proposal-partner-email" className="block text-sm font-medium mb-1">Partner Email</label>
            <input
              id="proposal-partner-email"
              name="partnerEmail"
              type="email"
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="proposal-booth-name" className="block text-sm font-medium mb-1">Booth Name</label>
            <input
              id="proposal-booth-name"
              name="boothName"
              type="text"
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="proposal-booth-price" className="block text-sm font-medium mb-1">Booth Price (Rp)</label>
            <input
              id="proposal-booth-price"
              name="boothPrice"
              type="number"
              min={1}
              required
              defaultValue={workspace.currentUser.boothBasePrice}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="proposal-available-balance" className="block text-sm font-medium mb-1">Your Available Balance (Rp)</label>
            <input
              id="proposal-available-balance"
              name="requesterAvailableBalance"
              type="number"
              min={0}
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="proposal-partner-price" className="block text-sm font-medium mb-1">Partner Booth Price (Rp)</label>
            <input
              id="proposal-partner-price"
              name="partnerBoothPrice"
              type="number"
              min={1}
              defaultValue={9_500_000}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="proposal-expected-income" className="block text-sm font-medium mb-1">Expected Monthly Income (Rp)</label>
            <input
              id="proposal-expected-income"
              name="expectedMonthlyIncome"
              type="number"
              min={1}
              defaultValue={1_000_000}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="proposal-package-type" className="block text-sm font-medium mb-1">Package Type</label>
            <select
              id="proposal-package-type"
              name="packageType"
              defaultValue={BoothPackageType.ECONOMY}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            >
              <option value={BoothPackageType.ECONOMY}>Ekonomis (payout H+1 MoU)</option>
              <option value={BoothPackageType.EXCLUSIVE}>Eksklusif 20jt (payout di tanggal MoU)</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              Exclusive: minimum total modal Rp 20.000.000 dan tidak memakai referral economy commission.
            </p>
          </div>

          <div>
            <label htmlFor="proposal-mou-date" className="block text-sm font-medium mb-1">MoU Sign Date</label>
            <input
              id="proposal-mou-date"
              name="mouSignedAt"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="proposal-referrals" className="block text-sm font-medium mb-1">Referral Economy Booths (commission H+3)</label>
            <input
              id="proposal-referrals"
              name="referralEconomyBooths"
              type="number"
              min={0}
              defaultValue={0}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="proposal-selection-type" className="block text-sm font-medium mb-1">Booth Selection</label>
            <select
              id="proposal-selection-type"
              name="selectedBoothType"
              defaultValue={BoothSelectionType.NEW_BOOTH}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            >
              <option value={BoothSelectionType.NEW_BOOTH}>New Booth</option>
              <option value={BoothSelectionType.EXISTING_BOOTH}>Existing Booth</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="proposal-notes" className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              id="proposal-notes"
              name="notes"
              rows={3}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 px-3 py-2"
            />
          </div>

          <div className="md:col-span-2">
            <button className="rounded-xl px-4 py-2 bg-blue-700 text-white hover:bg-blue-800" type="submit">
              Execute Purchase Strategy
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Incoming Proposals</h2>
          <div className="space-y-3">
            {workspace.incomingProposals.length === 0 && (
              <p className="text-sm text-slate-500">No incoming proposals.</p>
            )}
            {workspace.incomingProposals.map((proposal) => (
              <div key={proposal.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm">
                <p className="font-semibold">{proposal.boothName}</p>
                <p className="text-slate-500">From: {proposal.requester.email}</p>
                <p>Capital split: Rp {proposal.requesterCapital.toLocaleString("id-ID")} / Rp {proposal.partnerCapital.toLocaleString("id-ID")}</p>
                <p>Status: {proposal.status}</p>

                {proposal.status === ProposalStatus.PENDING && (
                  <form action={handleReviewProposal} className="mt-2 flex flex-wrap items-center gap-2">
                    <input type="hidden" name="proposalId" value={proposal.id} />
                    <input type="hidden" name="reviewerUserId" value={workspace.currentUser.id} />
                    <input
                      type="text"
                      name="reviewerNote"
                      aria-label="Reviewer note"
                      placeholder="Optional note"
                      className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1"
                    />
                    <button name="decision" value="approve" className="rounded-md px-3 py-1 text-xs bg-emerald-600 text-white" type="submit">
                      Approve
                    </button>
                    <button name="decision" value="reject" className="rounded-md px-3 py-1 text-xs bg-rose-600 text-white" type="submit">
                      Reject
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Outgoing Proposals</h2>
          <div className="space-y-3">
            {workspace.outgoingProposals.length === 0 && (
              <p className="text-sm text-slate-500">No outgoing proposals.</p>
            )}
            {workspace.outgoingProposals.map((proposal) => (
              <div key={proposal.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-sm">
                <p className="font-semibold">{proposal.boothName}</p>
                <p className="text-slate-500">To: {proposal.partner.email}</p>
                <p>Capital split: Rp {proposal.requesterCapital.toLocaleString("id-ID")} / Rp {proposal.partnerCapital.toLocaleString("id-ID")}</p>
                <p>Status: {proposal.status}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Your Booth Portfolio</h2>
          <div className="space-y-3">
            {workspace.portfolio.length === 0 && (
              <p className="text-sm text-slate-500">No booth ownership yet.</p>
            )}
            {workspace.portfolio.map((item) => (
              <div key={item.boothId} className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm">
                <p className="font-semibold">{item.boothName}</p>
                <p>Expected Monthly Income: Rp {item.expectedMonthlyIncome.toLocaleString("id-ID")}</p>
                <p>Your Share: {item.revenueSharePct.toFixed(2)}%</p>
                <p>Your Capital: Rp {item.capitalAmount.toLocaleString("id-ID")}</p>
                <p>Type: {item.isShared ? "Shared" : "Owned"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 text-sm text-slate-600 dark:text-slate-300">
        <p className="font-semibold mb-1">Tip</p>
        <p>
          You can switch active user quickly with URL parameter <span className="font-mono">?user=nama@email.com</span>.
          This helps simulate collaboration flows while auth is not integrated yet.
        </p>
      </div>
    </div>
  );
}

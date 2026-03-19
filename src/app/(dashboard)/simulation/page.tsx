import { simulateCollaborativeGrowth, simulateSingleUserGrowth } from "@/actions/simulation";
import { getCollaborationWorkspace } from "@/actions/collaboration";
import { CalendarDays } from "lucide-react";
import { CsvActions } from "@/components/simulation/CsvActions";
import { formatGroupedNumber } from "@/lib/number-format";
import { formatJakartaDate } from "@/lib/date-format";
import { getActiveUserEmail } from "@/lib/active-user";
import { SimulationControlPanel } from "./SimulationControlPanel";

type SingleSimulation = Awaited<ReturnType<typeof simulateSingleUserGrowth>>;
type CollaborativeSimulation = Awaited<ReturnType<typeof simulateCollaborativeGrowth>>;
type SimulationParticipantView = {
  userId: string;
  email: string;
  displayName: string;
  boothPrice: number;
  monthlyExpense: number;
  purchaseTiming: "START_OF_MONTH" | "END_OF_MONTH";
  includeHoldingPlan: boolean;
  includePt2Plan: boolean;
  idleCashTarget: number;
  holdingFundAccumulated: number;
  personalHoldingTarget: number;
  holdingLaunchDate: Date;
  pt2LaunchDate: Date;
  projectedMonthlyIncome: number;
  boothEquivalentOwned: number;
  targetBoothEquivalent: number;
  activeBooths: number;
  cashBalance: number;
  bankBalance: number;
  personalPt2Target: number;
  pt2FundAccumulated: number;
  plans: Array<{
    month: string;
    purchaseDay: number;
    boothsAdded: number;
    monthlyBoothIncome: number;
    monthlyCommissionIncome: number;
    monthlyHoldingSaved: number;
    monthlyPt2Saved: number;
    totalBoothsEquivalent: number;
    monthEndCash: number;
    contractEvents: Array<{
      day: number;
      amount: number;
      label: string;
      type: EventFilter;
    }>;
  }>;
};

type EventFilter =
  | "all"
  | "renewal"
  | "capital_return"
  | "takeover"
  | "ended"
  | "pt2_contribution";
type CsvDelimiter = "comma" | "semicolon";

function getEventBadgeClass(eventType: EventFilter) {
  switch (eventType) {
    case "renewal":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "capital_return":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "takeover":
      return "bg-indigo-100 text-indigo-800 border-indigo-200";
    case "ended":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "pt2_contribution":
      return "bg-cyan-100 text-cyan-800 border-cyan-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getEventTypeLabel(eventType: EventFilter) {
  switch (eventType) {
    case "renewal":
      return "Renewal";
    case "capital_return":
      return "Capital Return";
    case "takeover":
      return "Takeover";
    case "ended":
      return "Ended";
    case "pt2_contribution":
      return "PT2 Urunan";
    default:
      return "All";
  }
}

function formatContractEvent(event: {
  day: number;
  amount: number;
  label: string;
  type: EventFilter;
}) {
  return `H${event.day}: ${event.label}${event.amount !== 0 ? ` (Rp ${formatGroupedNumber(event.amount)})` : ""}`;
}

function getEventSummary(
  plans: Array<{ contractEvents: Array<{ type: EventFilter }> }>,
) {
  const summary: Record<EventFilter, number> = {
    all: 0,
    renewal: 0,
    capital_return: 0,
    takeover: 0,
    ended: 0,
    pt2_contribution: 0,
  };

  for (const plan of plans) {
    summary.all += plan.contractEvents.length;
    for (const event of plan.contractEvents) {
      summary[event.type] += 1;
    }
  }

  return summary;
}

function buildContractEventsCsv(input: {
  userDisplayName: string;
  userEmail: string;
  eventFilter: EventFilter;
  includePt2Csv: boolean;
  delimiter: CsvDelimiter;
  plans: Array<{
    month: string;
    contractEvents: Array<{
      day: number;
      amount: number;
      label: string;
      type: EventFilter;
    }>;
  }>;
}) {
  const lines = [
    ["User", "Email", "Month", "Day", "Event Type", "Label", "Amount"],
  ];
  const delimiterChar = input.delimiter === "semicolon" ? ";" : ",";

  for (const plan of input.plans) {
    const eventsByFilter =
      input.eventFilter === "all"
        ? plan.contractEvents
        : plan.contractEvents.filter((event) => event.type === input.eventFilter);

    const events = input.includePt2Csv
      ? eventsByFilter
      : eventsByFilter.filter((event) => event.type !== "pt2_contribution");

    for (const event of events) {
      lines.push([
        input.userDisplayName,
        input.userEmail,
        plan.month,
        String(event.day),
        getEventTypeLabel(event.type),
        event.label,
        String(event.amount),
      ]);
    }
  }

  return lines
    .map((row) => row.map((value) => `"${value.replaceAll("\"", '""')}"`).join(delimiterChar))
    .join("\n");
}

function sanitizeFilePart(value: string) {
  return value
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]+/g, "-")
    .replaceAll(/-+/g, "-")
    .replaceAll(/^-|-$/g, "");
}

function getCsvFileName(input: {
  prefix: string;
  subject: string;
  targetDateStr: string;
  eventFilter: EventFilter;
  delimiter: CsvDelimiter;
  includePt2Csv: boolean;
}) {
  const cleanPrefix = sanitizeFilePart(input.prefix);
  const cleanSubject = sanitizeFilePart(input.subject);
  const cleanDate = sanitizeFilePart(input.targetDateStr);
  const cleanFilter = sanitizeFilePart(input.eventFilter);
  const cleanDelimiter = sanitizeFilePart(input.delimiter);
  const pt2Part = input.includePt2Csv ? "with-pt2" : "without-pt2";
  return `${cleanPrefix}-${cleanSubject}-${cleanDate}-${cleanFilter || "all"}-${cleanDelimiter}-${pt2Part}.csv`;
}

function buildCombinedContractEventsCsv(input: {
  users: Array<{
    displayName: string;
    email: string;
    plans: Array<{
      month: string;
      contractEvents: Array<{
        day: number;
        amount: number;
        label: string;
        type: EventFilter;
      }>;
    }>;
  }>;
  eventFilter: EventFilter;
  includePt2Csv: boolean;
  delimiter: CsvDelimiter;
}) {
  const lines = [
    ["User", "Email", "Month", "Day", "Event Type", "Label", "Amount"],
  ];
  const delimiterChar = input.delimiter === "semicolon" ? ";" : ",";

  for (const user of input.users) {
    for (const plan of user.plans) {
      const eventsByFilter =
        input.eventFilter === "all"
          ? plan.contractEvents
          : plan.contractEvents.filter((event) => event.type === input.eventFilter);

      const events = input.includePt2Csv
        ? eventsByFilter
        : eventsByFilter.filter((event) => event.type !== "pt2_contribution");

      for (const event of events) {
        lines.push([
          user.displayName,
          user.email,
          plan.month,
          String(event.day),
          getEventTypeLabel(event.type),
          event.label,
          String(event.amount),
        ]);
      }
    }
  }

  return lines
    .map((row) => row.map((value) => `"${value.replaceAll("\"", '""')}"`).join(delimiterChar))
    .join("\n");
}

export const dynamic = "force-dynamic";

export default async function SimulationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const activeEmail = await getActiveUserEmail(
    typeof sp.user === "string" ? sp.user : undefined,
  );
  const targetDateStr = typeof sp.date === "string" ? sp.date : "2028-08-01";
  const partnerEmailRaw = typeof sp.partner === "string" ? sp.partner.trim().toLowerCase() : "";
  const eventFilterRaw = typeof sp.eventFilter === "string" ? sp.eventFilter : "all";
  const delimiterRaw = typeof sp.delimiter === "string" ? sp.delimiter : "comma";
  const includePt2CsvRaw = typeof sp.includePt2Csv === "string" ? sp.includePt2Csv : "yes";
  const includeHoldingPlan = typeof sp.includeHolding === "string" && sp.includeHolding === "yes";
  const includePt2Plan = typeof sp.includePt2 === "string" && sp.includePt2 === "yes";
  const eventFilter: EventFilter =
    eventFilterRaw === "renewal" ||
    eventFilterRaw === "capital_return" ||
    eventFilterRaw === "takeover" ||
    eventFilterRaw === "ended" ||
    eventFilterRaw === "pt2_contribution"
      ? eventFilterRaw
      : "all";
  const delimiter: CsvDelimiter = delimiterRaw === "semicolon" ? "semicolon" : "comma";
  const includePt2Csv = includePt2CsvRaw !== "no";

  const targetDate = new Date(targetDateStr);
  const workspace = await getCollaborationWorkspace(activeEmail);
  const acceptedFriends = workspace.friendships.filter((friendship) => friendship.status === "ACCEPTED");
  const selectedFriend = acceptedFriends.find(
    (friendship) => friendship.friend.email.toLowerCase() === partnerEmailRaw,
  );

  const simulation: SingleSimulation | CollaborativeSimulation = selectedFriend
    ? await simulateCollaborativeGrowth({
        targetDate,
        primaryEmail: activeEmail,
        partnerEmail: selectedFriend.friend.email,
        includeHoldingPlan,
        includePt2Plan,
      })
    : await simulateSingleUserGrowth({
        targetDate,
        email: activeEmail,
        includeHoldingPlan,
        includePt2Plan,
      });

  const partnerParticipant = "partner" in simulation ? simulation.partner : null;
  const participants = (partnerParticipant
    ? [simulation.primary, partnerParticipant]
    : [simulation.primary]) as SimulationParticipantView[];

  const combinedCsvContent = buildCombinedContractEventsCsv({
    users: participants.map((user) => ({
      displayName: user.displayName,
      email: user.email,
      plans: user.plans,
    })),
    eventFilter,
    includePt2Csv,
    delimiter,
  });
  const combinedCsvFileName = getCsvFileName({
    prefix: "timeline",
    subject: "combined",
    targetDateStr,
    eventFilter,
    delimiter,
    includePt2Csv,
  });
  const combinedPt2Fund = participants.reduce((acc, user) => acc + user.pt2FundAccumulated, 0);
  const combinedPt2Target = participants.reduce((acc, user) => acc + user.personalPt2Target, 0);
  const showHoldingPlan = participants.some(
    (user) => user.includeHoldingPlan && user.personalHoldingTarget > 0,
  );
  const showPt2Plan = participants.some(
    (user) => user.includePt2Plan && user.personalPt2Target > 0,
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Simulation</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Simulasi pertumbuhan booth personal atau kolaboratif berdasarkan budget, pendapatan, dan strategi timing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <SimulationControlPanel
            activeEmail={activeEmail}
            basePrice={workspace.currentUser.boothBasePrice}
            initialTargetDate={targetDateStr}
            initialPartnerEmail={selectedFriend?.friend.email ?? ""}
            initialDelimiter={delimiter}
            initialIncludePt2Csv={includePt2Csv}
            initialEventFilter={eventFilter}
            initialIncludeHoldingPlan={includeHoldingPlan}
            initialIncludePt2Plan={includePt2Plan}
            acceptedFriends={acceptedFriends.map((friendship) => ({
              id: friendship.id,
              email: friendship.friend.email,
              displayName: friendship.friend.displayName,
            }))}
            financeProfile={workspace.financeProfile}
          />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="surface-card p-6">
            <p className="text-xs uppercase tracking-widest font-semibold text-body-muted mb-2">
              {participants.length > 1 ? "Combined" : "Projected"} Result • {formatJakartaDate(targetDate)}
            </p>
            <p className="text-4xl md:text-5xl font-bold tracking-tight text-title">
              Rp {formatGroupedNumber(Math.max(0, simulation.combined.totalProjectedIncome))}
            </p>
            <div className={`mt-6 grid grid-cols-1 ${showPt2Plan ? "md:grid-cols-3" : "md:grid-cols-2"} gap-3`}>
              <div className="surface-card-soft px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-body-muted">Total Booth Equivalent</p>
                <p className="text-lg font-bold text-projection">{simulation.combined.totalBoothEquivalent.toFixed(2)} Eq.</p>
              </div>
              <div className="surface-card-soft px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-body-muted">Participants</p>
                <p className="text-lg font-bold text-collab">{participants.length} User</p>
              </div>
              {showPt2Plan ? (
                <div className="surface-card-soft px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wider text-body-muted">PT2 Progress</p>
                  <p className="text-lg font-bold text-goal">
                    Rp {formatGroupedNumber(combinedPt2Fund)} / {formatGroupedNumber(combinedPt2Target)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className={`grid grid-cols-1 ${participants.length > 1 ? "xl:grid-cols-2" : ""} gap-6`}>
            {participants.map((user) => (
              <div key={user.userId} className="surface-card p-6">
                <h3 className="text-lg font-semibold mb-1">{user.displayName}</h3>
                <p className="text-xs text-slate-500 mb-4">{user.email}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="surface-card-soft px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-body-muted">Harga Booth</p>
                    <p className="font-bold">Rp {formatGroupedNumber(user.boothPrice)}</p>
                  </div>
                  <div className="surface-card-soft px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-body-muted">Budget Bulanan</p>
                    <p className="font-bold">Rp {formatGroupedNumber(user.monthlyExpense)}</p>
                  </div>
                  <div className="surface-card-soft px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-body-muted">Timing Beli</p>
                    <p className="font-bold">{user.purchaseTiming === "START_OF_MONTH" ? "Awal Bulan" : "Akhir Bulan"}</p>
                  </div>
                  <div className="surface-card-soft px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-body-muted">Idle Cash Target</p>
                    <p className="font-bold">Rp {formatGroupedNumber(user.idleCashTarget)}</p>
                  </div>
                  <div className="surface-card-soft px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-body-muted">Booth Eq. Saat Ini</p>
                    <p className="font-bold">{user.boothEquivalentOwned.toFixed(2)}</p>
                  </div>
                  <div className="surface-card-soft px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-body-muted">Projected Income</p>
                    <p className="font-bold text-income">Rp {formatGroupedNumber(user.projectedMonthlyIncome)}</p>
                  </div>
                  <div className="surface-card-soft px-3 py-2 sm:col-span-2">
                    <p className="text-[11px] uppercase tracking-wider text-body-muted">Target Booth Equivalent</p>
                    <p className="font-bold">{user.targetBoothEquivalent}</p>
                  </div>

                  {showHoldingPlan && user.includeHoldingPlan && user.personalHoldingTarget > 0 ? (
                    <>
                      <div className="surface-card-soft px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wider text-body-muted">Holding Fund</p>
                        <p className="font-bold text-goal">
                          Rp {formatGroupedNumber(user.holdingFundAccumulated)} / {formatGroupedNumber(user.personalHoldingTarget)}
                        </p>
                      </div>
                      <div className="surface-card-soft px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wider text-body-muted">Holding Launch</p>
                        <p className="font-bold">{formatJakartaDate(user.holdingLaunchDate)}</p>
                      </div>
                    </>
                  ) : null}

                  {showPt2Plan && user.includePt2Plan && user.personalPt2Target > 0 ? (
                    <>
                      <div className="surface-card-soft px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wider text-body-muted">PT2 Urunan Fund</p>
                        <p className="font-bold text-collab">
                          Rp {formatGroupedNumber(user.pt2FundAccumulated)} / {formatGroupedNumber(user.personalPt2Target)}
                        </p>
                      </div>
                      <div className="surface-card-soft px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wider text-body-muted">PT2 Target Date</p>
                        <p className="font-bold">{formatJakartaDate(user.pt2LaunchDate)}</p>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-card p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-semibold">Monthly Booth Addition Plan</h2>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              CSV mode: {includePt2Csv ? "with PT2" : "without PT2"}
            </p>
            <CsvActions
              csvContent={combinedCsvContent}
              fileName={combinedCsvFileName}
              downloadLabel="Export Combined CSV"
              copyLabel="Copy Combined CSV"
            />
          </div>
        </div>

        <div className={`grid grid-cols-1 ${participants.length > 1 ? "xl:grid-cols-2" : ""} gap-6`}>
          {participants.map((user) => {
            const eventSummary = getEventSummary(user.plans);
            const csvContent = buildContractEventsCsv({
              userDisplayName: user.displayName,
              userEmail: user.email,
              eventFilter,
              includePt2Csv,
              delimiter,
              plans: user.plans,
            });
            const csvFileName = getCsvFileName({
              prefix: "timeline",
              subject: user.displayName,
              targetDateStr,
              eventFilter,
              delimiter,
              includePt2Csv,
            });

            return (
            <div key={user.userId} className="surface-card overflow-hidden">
              <div className="px-4 py-3 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-semibold">{user.displayName} - Rencana Bulanan</h3>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center rounded-md border px-2 py-1 bg-slate-100 text-slate-700 border-slate-200">
                    Total: {eventSummary.all}
                  </span>
                  <span className="inline-flex items-center rounded-md border px-2 py-1 bg-amber-100 text-amber-800 border-amber-200">
                    Renewal: {eventSummary.renewal}
                  </span>
                  <span className="inline-flex items-center rounded-md border px-2 py-1 bg-emerald-100 text-emerald-800 border-emerald-200">
                    Return: {eventSummary.capital_return}
                  </span>
                  <span className="inline-flex items-center rounded-md border px-2 py-1 bg-indigo-100 text-indigo-800 border-indigo-200">
                    Takeover: {eventSummary.takeover}
                  </span>
                  <span className="inline-flex items-center rounded-md border px-2 py-1 bg-rose-100 text-rose-800 border-rose-200">
                    Ended: {eventSummary.ended}
                  </span>
                  {showPt2Plan ? (
                    <span className="inline-flex items-center rounded-md border px-2 py-1 bg-cyan-100 text-cyan-800 border-cyan-200">
                      PT2: {eventSummary.pt2_contribution}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {user.plans.map((plan) => {
                  const filteredEvents =
                    eventFilter === "all"
                      ? plan.contractEvents
                      : plan.contractEvents.filter((event) => event.type === eventFilter);

                  return (
                    <div key={`${user.userId}-${plan.month}-mobile`} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{plan.month}</p>
                        <span className="text-xs font-medium text-slate-500">Buy day: {plan.purchaseDay}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="surface-card-soft px-2.5 py-2">
                          <p className="text-body-muted">Add Booth</p>
                          <p className="font-semibold text-projection">{plan.boothsAdded}</p>
                        </div>
                        <div className="surface-card-soft px-2.5 py-2">
                          <p className="text-body-muted">Total Eq.</p>
                          <p className="font-semibold">{plan.totalBoothsEquivalent.toFixed(2)}</p>
                        </div>
                        <div className="surface-card-soft px-2.5 py-2">
                          <p className="text-body-muted">Booth Income</p>
                          <p className="font-semibold">Rp {formatGroupedNumber(plan.monthlyBoothIncome)}</p>
                        </div>
                        <div className="surface-card-soft px-2.5 py-2">
                          <p className="text-body-muted">End Cash</p>
                          <p className="font-semibold">Rp {formatGroupedNumber(plan.monthEndCash)}</p>
                        </div>
                        {showHoldingPlan ? (
                          <div className="surface-card-soft px-2.5 py-2">
                            <p className="text-body-muted">Holding Save</p>
                            <p className="font-semibold">Rp {formatGroupedNumber(plan.monthlyHoldingSaved)}</p>
                          </div>
                        ) : null}
                        {showPt2Plan ? (
                          <div className="surface-card-soft px-2.5 py-2">
                            <p className="text-body-muted">PT2 Save</p>
                            <p className="font-semibold">Rp {formatGroupedNumber(plan.monthlyPt2Saved)}</p>
                          </div>
                        ) : null}
                      </div>

                      <div className="text-xs">
                        <p className="text-body-muted mb-1">Contract Events</p>
                        {filteredEvents.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {filteredEvents.map((event, index) => (
                              <span
                                key={`${user.userId}-${plan.month}-${event.type}-${index}-mobile`}
                                className={`inline-flex items-center rounded-md border px-2 py-1 ${getEventBadgeClass(event.type)}`}
                                title={formatContractEvent(event)}
                              >
                                {getEventTypeLabel(event.type)} H{event.day}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400">-</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Month</th>
                      <th className="px-3 py-2">Buy Day</th>
                      <th className="px-3 py-2">Add Booth</th>
                      <th className="px-3 py-2">Booth Income</th>
                      <th className="px-3 py-2">Commission</th>
                      {showHoldingPlan ? <th className="px-3 py-2">Holding Save</th> : null}
                      {showPt2Plan ? <th className="px-3 py-2">PT 2 Save</th> : null}
                      <th className="px-3 py-2">Contract Events</th>
                      <th className="px-3 py-2">Total Eq.</th>
                      <th className="px-3 py-2">End Cash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {user.plans.map((plan) => {
                      const filteredEvents =
                        eventFilter === "all"
                          ? plan.contractEvents
                          : plan.contractEvents.filter((event) => event.type === eventFilter);

                      return (
                      <tr key={`${user.userId}-${plan.month}`}>
                        <td className="px-3 py-2">{plan.month}</td>
                        <td className="px-3 py-2">{plan.purchaseDay}</td>
                        <td className="px-3 py-2 font-semibold text-blue-600">{plan.boothsAdded}</td>
                        <td className="px-3 py-2">Rp {formatGroupedNumber(plan.monthlyBoothIncome)}</td>
                        <td className="px-3 py-2">Rp {formatGroupedNumber(plan.monthlyCommissionIncome)}</td>
                        {showHoldingPlan ? <td className="px-3 py-2">Rp {formatGroupedNumber(plan.monthlyHoldingSaved)}</td> : null}
                        {showPt2Plan ? <td className="px-3 py-2">Rp {formatGroupedNumber(plan.monthlyPt2Saved)}</td> : null}
                        <td className="px-3 py-2 text-xs">
                          {filteredEvents.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {filteredEvents.map((event, index) => (
                                <span
                                  key={`${user.userId}-${plan.month}-${event.type}-${index}`}
                                  className={`inline-flex items-center rounded-md border px-2 py-1 ${getEventBadgeClass(event.type)}`}
                                  title={formatContractEvent(event)}
                                >
                                  {getEventTypeLabel(event.type)} H{event.day}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 dark:text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{plan.totalBoothsEquivalent.toFixed(2)}</td>
                        <td className="px-3 py-2">Rp {formatGroupedNumber(plan.monthEndCash)}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h4 className="text-sm font-semibold">
                    Strategy Timeline ({getEventTypeLabel(eventFilter)})
                  </h4>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {includePt2Csv ? "with PT2 in CSV" : "without PT2 in CSV"}
                    </p>
                    <CsvActions
                      csvContent={csvContent}
                      fileName={csvFileName}
                    />
                  </div>
                </div>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  {user.plans.filter((plan) =>
                    (eventFilter === "all"
                      ? plan.contractEvents
                      : plan.contractEvents.filter((event) => event.type === eventFilter)).length > 0,
                  ).length === 0 && (
                    <p>No contract lifecycle events in selected range.</p>
                  )}
                  {user.plans
                    .map((plan) => {
                      const filteredEvents =
                        eventFilter === "all"
                          ? plan.contractEvents
                          : plan.contractEvents.filter((event) => event.type === eventFilter);

                      if (filteredEvents.length === 0) {
                        return null;
                      }

                      return (
                      <p key={`${user.userId}-${plan.month}-events`}>
                        <span className="font-medium">{plan.month}:</span>{" "}
                        {filteredEvents.map((event) => formatContractEvent(event)).join(" | ")}
                      </p>
                    );
                    })}
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  );
}

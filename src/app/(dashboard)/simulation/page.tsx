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

type EventFilter = "all" | "renewal" | "capital_return" | "takeover" | "ended" | "partner_suggestion";
type CsvDelimiter = "comma" | "semicolon";
type SimulationParticipant = {
  userId: string;
  displayName: string;
  email: string;
  boothPrice: number;
  monthlyExpense: number;
  purchaseTiming: "START_OF_MONTH" | "END_OF_MONTH";
  idleCashTarget: number;
  boothEquivalentOwned: number;
  projectedMonthlyIncome: number;
  targetBoothEquivalent: number;
  plans: Array<{
    month: string;
    purchaseDay: number;
    unitTotalOwned: number;
    boothsAdded: number;
    monthlyIncome: number;
    monthlyExpense: number;
    monthlyBoothIncome: number;
    monthlyCommissionIncome: number;
    monthlyNonBoothIncome: number;
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
    case "partner_suggestion":
      return "bg-sky-100 text-sky-800 border-sky-200";
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
    case "partner_suggestion":
      return "Patungan Suggestion";
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
    partner_suggestion: 0,
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
  const lines = [["User", "Email", "Month", "Day", "Event Type", "Label", "Amount"]];
  const delimiterChar = input.delimiter === "semicolon" ? ";" : ",";

  for (const plan of input.plans) {
    const events =
      input.eventFilter === "all"
        ? plan.contractEvents
        : plan.contractEvents.filter((event) => event.type === input.eventFilter);

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

function formatUnitTotal(value: number) {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(2);
}

function getCsvFileName(input: {
  prefix: string;
  subject: string;
  targetDateStr: string;
  eventFilter: EventFilter;
  delimiter: CsvDelimiter;
}) {
  const cleanPrefix = sanitizeFilePart(input.prefix);
  const cleanSubject = sanitizeFilePart(input.subject);
  const cleanDate = sanitizeFilePart(input.targetDateStr);
  const cleanFilter = sanitizeFilePart(input.eventFilter);
  const cleanDelimiter = sanitizeFilePart(input.delimiter);
  return `${cleanPrefix}-${cleanSubject}-${cleanDate}-${cleanFilter || "all"}-${cleanDelimiter}.csv`;
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

  const eventFilter: EventFilter =
    eventFilterRaw === "renewal" ||
    eventFilterRaw === "capital_return" ||
    eventFilterRaw === "takeover" ||
    eventFilterRaw === "ended" ||
    eventFilterRaw === "partner_suggestion"
      ? eventFilterRaw
      : "all";
  const delimiter: CsvDelimiter = delimiterRaw === "semicolon" ? "semicolon" : "comma";

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
      })
    : await simulateSingleUserGrowth({
        targetDate,
        email: activeEmail,
      });

  const partnerParticipant = "partner" in simulation ? simulation.partner : null;
  const participants: SimulationParticipant[] = partnerParticipant
    ? [simulation.primary as SimulationParticipant, partnerParticipant as SimulationParticipant]
    : [simulation.primary as SimulationParticipant];

  const combinedCsvContent = participants
    .map((user) =>
      buildContractEventsCsv({
        userDisplayName: user.displayName,
        userEmail: user.email,
        eventFilter,
        delimiter,
        plans: user.plans,
      }),
    )
    .join("\n");

  const combinedCsvFileName = getCsvFileName({
    prefix: "timeline",
    subject: "combined",
    targetDateStr,
    eventFilter,
    delimiter,
  });

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">Simulation</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Simulasi pertumbuhan booth personal atau kolaboratif berdasarkan budget, pendapatan, dan strategi timing.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <SimulationControlPanel
            activeEmail={activeEmail}
            basePrice={workspace.currentUser.boothBasePrice}
            initialTargetDate={targetDateStr}
            initialPartnerEmail={selectedFriend?.friend.email ?? ""}
            initialDelimiter={delimiter}
            initialEventFilter={eventFilter}
            acceptedFriends={acceptedFriends.map((friendship) => ({
              id: friendship.id,
              email: friendship.friend.email,
              displayName: friendship.friend.displayName,
            }))}
            financeProfile={workspace.financeProfile}
          />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="surface-card p-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-body-muted">
              {participants.length > 1 ? "Combined" : "Projected"} Result • {formatJakartaDate(targetDate)}
            </p>
            <p className="text-title text-4xl font-bold tracking-tight md:text-5xl">
              Rp {formatGroupedNumber(Math.max(0, simulation.combined.totalProjectedIncome))}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="surface-card-soft px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-body-muted">Total Income Eq.</p>
                <p className="text-projection text-lg font-bold">{simulation.combined.totalBoothEquivalent.toFixed(2)} Eq.</p>
              </div>
              <div className="surface-card-soft px-4 py-3">
                <p className="text-[11px] uppercase tracking-wider text-body-muted">Participants</p>
                <p className="text-collab text-lg font-bold">{participants.length} User</p>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 gap-6 ${participants.length > 1 ? "xl:grid-cols-2" : ""}`}>
            {participants.map((user) => (
              <div key={user.userId} className="surface-card p-6">
                <h3 className="mb-1 text-lg font-semibold">{user.displayName}</h3>
                <p className="mb-4 text-xs text-slate-500">{user.email}</p>

                <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
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
                    <p className="text-income font-bold">Rp {formatGroupedNumber(user.projectedMonthlyIncome)}</p>
                  </div>
                  <div className="surface-card-soft px-3 py-2 sm:col-span-2">
                    <p className="text-[11px] uppercase tracking-wider text-body-muted">Target Income Eq.</p>
                    <p className="font-bold">{user.targetBoothEquivalent}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface-card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-semibold">Monthly Booth Addition Plan</h2>
          </div>
          <CsvActions
            csvContent={combinedCsvContent}
            fileName={combinedCsvFileName}
            downloadLabel="Export Combined CSV"
            copyLabel="Copy Combined CSV"
          />
        </div>

        <div className={`grid grid-cols-1 gap-6 ${participants.length > 1 ? "xl:grid-cols-2" : ""}`}>
          {participants.map((user) => {
            const eventSummary = getEventSummary(user.plans);
            const csvContent = buildContractEventsCsv({
              userDisplayName: user.displayName,
              userEmail: user.email,
              eventFilter,
              delimiter,
              plans: user.plans,
            });
            const csvFileName = getCsvFileName({
              prefix: "timeline",
              subject: user.displayName,
              targetDateStr,
              eventFilter,
              delimiter,
            });

            return (
              <div key={user.userId} className="surface-card overflow-hidden">
                <div className="border-b border-slate-200 bg-slate-50/60 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <h3 className="font-semibold">{user.displayName} - Rencana Bulanan</h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-slate-700">
                      Total: {eventSummary.all}
                    </span>
                    <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-100 px-2 py-1 text-amber-800">
                      Renewal: {eventSummary.renewal}
                    </span>
                    <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-100 px-2 py-1 text-emerald-800">
                      Return: {eventSummary.capital_return}
                    </span>
                    <span className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-100 px-2 py-1 text-indigo-800">
                      Takeover: {eventSummary.takeover}
                    </span>
                    <span className="inline-flex items-center rounded-md border border-rose-200 bg-rose-100 px-2 py-1 text-rose-800">
                      Ended: {eventSummary.ended}
                    </span>
                    <span className="inline-flex items-center rounded-md border border-sky-200 bg-sky-100 px-2 py-1 text-sky-800">
                      Patungan: {eventSummary.partner_suggestion}
                    </span>
                  </div>
                </div>

                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Month</th>
                        <th className="px-3 py-2">Unit Total (Currently)</th>
                        <th className="px-3 py-2">Add Booth</th>
                        <th className="px-3 py-2">Booth Income</th>
                        <th className="px-3 py-2">Booth Commission</th>
                        <th className="px-3 py-2">Non-Booth Income</th>
                        <th className="px-3 py-2">Total Income</th>
                        <th className="px-3 py-2">Expense (Budget)</th>
                        <th className="px-3 py-2">Contract Events</th>
                        <th className="px-3 py-2">Income Eq.</th>
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
                            <td className="px-3 py-2">{formatUnitTotal(plan.unitTotalOwned)}</td>
                            <td className="px-3 py-2 font-semibold text-blue-600">{plan.boothsAdded}</td>
                            <td className="px-3 py-2">Rp {formatGroupedNumber(plan.monthlyBoothIncome)}</td>
                            <td className="px-3 py-2">Rp {formatGroupedNumber(plan.monthlyCommissionIncome)}</td>
                            <td className="px-3 py-2">Rp {formatGroupedNumber(plan.monthlyNonBoothIncome)}</td>
                            <td className="px-3 py-2">Rp {formatGroupedNumber(plan.monthlyIncome)}</td>
                            <td className="px-3 py-2">Rp {formatGroupedNumber(plan.monthlyExpense)}</td>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-200 bg-slate-50/30 p-4 dark:border-slate-800 dark:bg-slate-900/20">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold">Strategy Timeline ({getEventTypeLabel(eventFilter)})</h4>
                    <CsvActions csvContent={csvContent} fileName={csvFileName} />
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    {user.plans.filter((plan) =>
                      (eventFilter === "all"
                        ? plan.contractEvents
                        : plan.contractEvents.filter((event) => event.type === eventFilter)).length > 0,
                    ).length === 0 && <p>No contract lifecycle events in selected range.</p>}
                    {user.plans.map((plan) => {
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
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { simulateCollaborativeGrowth } from "@/actions/simulation";
import { Calculator, Users, TrendingUp, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CsvActions } from "@/components/simulation/CsvActions";

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
  return `H${event.day}: ${event.label}${event.amount !== 0 ? ` (Rp ${event.amount.toLocaleString("id-ID")})` : ""}`;
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
  const eventFilterRaw = typeof sp.eventFilter === "string" ? sp.eventFilter : "all";
  const delimiterRaw = typeof sp.delimiter === "string" ? sp.delimiter : "comma";
  const includePt2CsvRaw = typeof sp.includePt2Csv === "string" ? sp.includePt2Csv : "yes";
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
  const simulation = await simulateCollaborativeGrowth({
    targetDate,
    primaryEmail,
    partnerEmail,
  });

  const combinedCsvContent = buildCombinedContractEventsCsv({
    users: [simulation.primary, simulation.partner].map((user) => ({
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
  const combinedPt2Fund =
    simulation.primary.pt2FundAccumulated + simulation.partner.pt2FundAccumulated;
  const combinedPt2Target =
    simulation.primary.personalPt2Target + simulation.partner.personalPt2Target;

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

            <div>
              <label htmlFor="sim-event-filter" className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Strategy Event Filter
              </label>
              <select
                id="sim-event-filter"
                name="eventFilter"
                defaultValue={eventFilter}
                className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Events</option>
                <option value="renewal">Renewal</option>
                <option value="capital_return">Capital Return</option>
                <option value="takeover">Takeover</option>
                <option value="ended">Ended</option>
                <option value="pt2_contribution">PT2 Urunan</option>
              </select>
            </div>

            <div>
              <label htmlFor="sim-csv-delimiter" className="text-sm font-medium text-slate-600 dark:text-slate-400">
                CSV Delimiter
              </label>
              <select
                id="sim-csv-delimiter"
                name="delimiter"
                defaultValue={delimiter}
                className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="comma">Comma (,)</option>
                <option value="semicolon">Semicolon (;)</option>
              </select>
            </div>

            <div>
              <label htmlFor="sim-include-pt2-csv" className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Include PT2 Urunan In CSV
              </label>
              <select
                id="sim-include-pt2-csv"
                name="includePt2Csv"
                defaultValue={includePt2Csv ? "yes" : "no"}
                className="w-full mt-1.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black/50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
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
            <div className="mt-8 pt-6 border-t border-blue-400/30 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-200" />
                Total Booth Equivalent: {simulation.combined.totalBoothEquivalent.toFixed(2)}
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-200" />
                Kalkulasi memperhitungkan cashflow bulanan sebelum dan sesudah tanggal pembelian booth.
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-200" />
                Total PT2 Urunan: Rp {combinedPt2Fund.toLocaleString("id-ID")} / Rp {combinedPt2Target.toLocaleString("id-ID")}
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
                  <p>Idle Cash Target: Rp {user.idleCashTarget.toLocaleString("id-ID")}</p>
                  <p>Holding Fund: Rp {user.holdingFundAccumulated.toLocaleString("id-ID")} / Rp {user.personalHoldingTarget.toLocaleString("id-ID")}</p>
                  <p>Holding Launch: {new Date(user.holdingLaunchDate).toLocaleDateString("id-ID")}</p>
                  <p>PT 2 Urunan Fund: Rp {user.pt2FundAccumulated.toLocaleString("id-ID")} / Rp {user.personalPt2Target.toLocaleString("id-ID")}</p>
                  <p>PT 2 Target Date: {new Date(user.pt2LaunchDate).toLocaleDateString("id-ID")}</p>
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[simulation.primary, simulation.partner].map((user) => {
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
            <div key={user.userId} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
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
                  <span className="inline-flex items-center rounded-md border px-2 py-1 bg-cyan-100 text-cyan-800 border-cyan-200">
                    PT2: {eventSummary.pt2_contribution}
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Month</th>
                      <th className="px-3 py-2">Buy Day</th>
                      <th className="px-3 py-2">Add Booth</th>
                      <th className="px-3 py-2">Booth Income</th>
                      <th className="px-3 py-2">Commission</th>
                      <th className="px-3 py-2">Holding Save</th>
                      <th className="px-3 py-2">PT 2 Save</th>
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
                        <td className="px-3 py-2">Rp {plan.monthlyBoothIncome.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2">Rp {plan.monthlyCommissionIncome.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2">Rp {plan.monthlyHoldingSaved.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2">Rp {plan.monthlyPt2Saved.toLocaleString("id-ID")}</td>
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
                        <td className="px-3 py-2">Rp {plan.monthEndCash.toLocaleString("id-ID")}</td>
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

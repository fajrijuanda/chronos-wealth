import Link from "next/link";
import { ProposalStatus } from "@prisma/client";
import { getCollaborationWorkspace } from "@/actions/collaboration";
import { getActiveUserEmail } from "@/lib/active-user";
import { formatGroupedNumber } from "@/lib/number-format";
import {
  Users,
  Target,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Briefcase,
  UserRoundPlus,
} from "lucide-react";

import { RespondFriendshipActions } from "./RespondFriendshipActions";
import { ProposeBoothDialog } from "./ProposeBoothDialog";
import { ReviewProposalDialog } from "./ReviewProposalDialog";
import { SimulationSettingsDialog } from "../simulation/SimulationSettingsDialog";
import { EditBoothTargetDialog } from "../targets/EditBoothTargetDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";

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

  const acceptedPartners = workspace.friendships.filter((f) => f.status === "ACCEPTED");
  const pendingIncoming = workspace.friendships.filter((f) => f.canRespond);
  const allProposals = [...workspace.incomingProposals, ...workspace.outgoingProposals].sort(
    (a, b) => b.proposedAt.getTime() - a.proposedAt.getTime(),
  );

  const getStatusIcon = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.APPROVED:
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case ProposalStatus.REJECTED:
        return <XCircle className="w-4 h-4 text-rose-500" />;
      default:
        return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.APPROVED:
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Approved
          </Badge>
        );
      case ProposalStatus.REJECTED:
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Collaboration</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Kelola partner aktif dan proposal booth bersama untuk dipakai di simulasi.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href="/settings?tab=connections" className="flex items-center gap-2">
              <UserRoundPlus className="w-4 h-4" />
              Manage Connections
            </Link>
          </Button>
          <ProposeBoothDialog
            email={workspace.currentUser.email}
            basePrice={workspace.currentUser.boothBasePrice}
            friends={acceptedPartners.map((f) => ({
              email: f.friend.email,
              name: f.friend.displayName,
            }))}
            disabled={acceptedPartners.length === 0}
          />
        </div>
      </div>

      {acceptedPartners.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          Belum ada partner accepted. Buka tab Connections di halaman Settings untuk kirim dan menerima koneksi dulu.
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-3xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm space-y-6">
            <div className="flex items-center gap-3 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="font-bold text-lg">Personal Target</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                  Target Income
                </p>
                <p className="text-2xl font-bold">Rp {formatGroupedNumber(workspace.targetProgress.targetIncome)}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">
                      Progress: {workspace.targetProgress.boothEquivalentAchieved.toFixed(2)} / {workspace.targetProgress.targetBoothEquivalent} Eq.
                    </span>
                    <span className="text-indigo-600">{workspace.targetProgress.progressPct.toFixed(1)}%</span>
                  </div>
                  <progress
                    value={Math.min(100, workspace.targetProgress.progressPct)}
                    max={100}
                    className="w-full h-2 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:bg-indigo-600 [&::-moz-progress-bar]:bg-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <MetricCard
                  size="sm"
                  title="Current Share"
                  value={`Rp ${formatGroupedNumber(workspace.targetProgress.monthlyIncomeShare)}`}
                  tone="income"
                />
                <MetricCard
                  size="sm"
                  title="Revenue/Booth"
                  value={`Rp ${formatGroupedNumber(workspace.targetProgress.revenuePerBooth)}`}
                  tone="goal"
                />
              </div>

              <EditBoothTargetDialog
                email={workspace.currentUser.email}
                currentTarget={workspace.targetProgress.targetBoothEquivalent}
                currentRevenue={workspace.targetProgress.revenuePerBooth}
              />
            </div>
          </div>

          <div className="rounded-3xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="font-bold text-lg">Simulation Profile</h2>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <span className="text-slate-500">Monthly Expense</span>
                <span className="font-medium font-mono text-xs">
                  Rp {formatGroupedNumber(workspace.financeProfile?.monthlyExpenseMin ?? 0)} - {formatGroupedNumber(workspace.financeProfile?.monthlyExpenseMax ?? 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <span className="text-slate-500">Idle Cash Target</span>
                <span className="font-medium">Rp {formatGroupedNumber(workspace.financeProfile?.idleCashTarget ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <span className="text-slate-500">Purchase Timing</span>
                <span className="font-medium text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase">
                  {workspace.financeProfile?.purchaseTiming.replace(/_/g, " ") ?? "END OF MONTH"}
                </span>
              </div>

              <SimulationSettingsDialog email={workspace.currentUser.email} profile={workspace.financeProfile} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-3xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                  <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="font-bold text-lg">Partner Network</h2>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {acceptedPartners.length} Connected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acceptedPartners.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada partner accepted.</p>
              ) : (
                acceptedPartners.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 bg-white/40 dark:bg-black/20">
                    <p className="font-semibold">{item.friend.displayName}</p>
                    <p className="text-xs text-slate-500">{item.friend.email}</p>
                  </div>
                ))
              )}
            </div>

            {pendingIncoming.length > 0 ? (
              <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pending Requests to You</h3>
                {pendingIncoming.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold">{item.friend.displayName}</p>
                      <p className="text-xs text-slate-500">{item.friend.email}</p>
                    </div>
                    <RespondFriendshipActions friendshipId={item.id} friendName={item.friend.displayName} />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                  <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="font-bold text-lg">Booth Proposals</h2>
              </div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{allProposals.length} Total</div>
            </div>

            <div className="space-y-4">
              {allProposals.length === 0 ? (
                <p className="text-sm text-slate-500">Tidak ada proposal saat ini.</p>
              ) : (
                allProposals.map((proposal) => {
                  const isIncoming = proposal.partnerId === workspace.currentUser.id;
                  const canReview = isIncoming && proposal.status === ProposalStatus.PENDING;

                  return (
                    <div key={proposal.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-5 bg-white/30 dark:bg-white/5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold">{proposal.boothName}</p>
                            {getStatusBadge(proposal.status)}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Dari {proposal.requester.displayName} ke {proposal.partner.displayName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                          <ArrowUpRight className="w-4 h-4" />
                          Rp {formatGroupedNumber(proposal.requesterCapital + proposal.partnerCapital)}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1 uppercase font-semibold">
                          {proposal.packageType}
                        </span>
                        <span>{isIncoming ? "Incoming" : "Outgoing"}</span>
                      </div>

                      {canReview ? (
                        <ReviewProposalDialog
                          proposalId={proposal.id}
                          reviewerUserId={workspace.currentUser.id}
                          boothName={proposal.boothName}
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          {getStatusIcon(proposal.status)}
                          <span>
                            {proposal.status === ProposalStatus.PENDING
                              ? "Awaiting partner review"
                              : "Proposal processed"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import {
  ProposalStatus,
} from "@prisma/client";
import {
  getCollaborationWorkspace,
} from "@/actions/collaboration";
import { getActiveUserEmail } from "@/lib/active-user";
import { formatGroupedNumber } from "@/lib/number-format";
import { 
  Users, 
  Target, 
  Handshake, 
  ArrowUpRight, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  XCircle,
  TrendingUp,
  Briefcase
} from "lucide-react";

import { AddFriendDialog } from "./AddFriendDialog";
import { RespondFriendshipActions } from "./RespondFriendshipActions";
import { ProposeBoothDialog } from "./ProposeBoothDialog";
import { ReviewProposalDialog } from "./ReviewProposalDialog";
import { SimulationSettingsDialog } from "../simulation/SimulationSettingsDialog";
import { EditBoothTargetDialog } from "../targets/EditBoothTargetDialog";
import { Badge } from "@/components/ui/badge";

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

  const getStatusIcon = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.APPROVED: return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case ProposalStatus.REJECTED: return <XCircle className="w-4 h-4 text-rose-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.APPROVED: 
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Approved</Badge>;
      case ProposalStatus.REJECTED: 
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">Rejected</Badge>;
      default: 
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Collaboration</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Kelola partner, target personal, dan pengajuan pembelian booth bersama.
          </p>
        </div>
        <div className="flex gap-3">
          <AddFriendDialog requesterEmail={workspace.currentUser.email} />
          <ProposeBoothDialog 
            email={workspace.currentUser.email} 
            basePrice={workspace.currentUser.boothBasePrice}
            friends={workspace.friendships
              .filter(f => f.status === "ACCEPTED")
              .map(f => ({ email: f.friend.email, name: f.friend.displayName }))
            }
          />
        </div>
      </div>

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
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Target Income</p>
                <p className="text-2xl font-bold">Rp {formatGroupedNumber(workspace.targetProgress.targetIncome)}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-500">Progress: {workspace.targetProgress.boothEquivalentAchieved.toFixed(2)} / {workspace.targetProgress.targetBoothEquivalent} Eq.</span>
                    <span className="text-indigo-600">{workspace.targetProgress.progressPct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-500" 
                      style={{ width: `${Math.min(100, workspace.targetProgress.progressPct)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Current Share</p>
                  <p className="font-semibold">Rp {formatGroupedNumber(workspace.targetProgress.monthlyIncomeShare)}</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-400 text-[10px] uppercase font-bold mb-1">Revenue/Booth</p>
                  <p className="font-semibold">Rp {formatGroupedNumber(workspace.targetProgress.revenuePerBooth)}</p>
                </div>
              </div>

              <div className="pt-2">
                <EditBoothTargetDialog 
                  email={workspace.currentUser.email} 
                  currentTarget={workspace.targetProgress.targetBoothEquivalent}
                  currentRevenue={workspace.targetProgress.revenuePerBooth}
                />
              </div>
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
                    {workspace.financeProfile?.purchaseTiming.replace(/_/g, ' ') ?? 'END OF MONTH'}
                </span>
              </div>
              
              <div className="pt-2">
                <SimulationSettingsDialog 
                  email={workspace.currentUser.email} 
                  profile={workspace.financeProfile} 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-3xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                        <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="font-bold text-lg">Partnerships</h2>
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {workspace.friendships.filter(f => f.status === "ACCEPTED").length} Active
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {workspace.friendships.length === 0 && (
                <div className="col-span-full py-10 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto opacity-50">
                        <Handshake className="w-6 h-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-400">Belum ada partner terhubung.</p>
                </div>
              )}
              {workspace.friendships.map((item) => (
                <div key={item.id} className="relative group p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/40 dark:bg-black/20 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center text-sm font-bold border border-white dark:border-slate-700">
                            {item.friend.displayName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-sm leading-tight">{item.friend.displayName}</p>
                            <p className="text-[10px] text-slate-400">{item.friend.email}</p>
                        </div>
                    </div>
                    <Badge variant={item.status === "ACCEPTED" ? "default" : "secondary"} className="text-[10px] h-5">
                        {item.status.toLowerCase()}
                    </Badge>
                  </div>
                  
                  {item.canRespond && (
                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                        <RespondFriendshipActions friendshipId={item.id} friendName={item.friend.displayName} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl backdrop-blur-md bg-white/60 dark:bg-slate-900/60 p-6 border border-white/20 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3 text-slate-800 dark:text-slate-200">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                        <Briefcase className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="font-bold text-lg">Active Proposals</h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    Pending Review
                </div>
            </div>

            <div className="space-y-4">
                {[...workspace.incomingProposals, ...workspace.outgoingProposals].length === 0 && (
                    <div className="py-12 text-center space-y-4 opacity-60">
                         <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <MessageSquare className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-medium">Tidak ada pengajuan aktif saat ini.</p>
                        <p className="text-xs text-slate-400 max-w-[280px] mx-auto italic">
                            Klik &quot;Buy / Propose Booth&quot; untuk mulai mengajukan pembelian atau kolaborasi baru.
                        </p>
                    </div>
                )}
                {[...workspace.incomingProposals, ...workspace.outgoingProposals].map((p) => {
                    const isIncoming = p.partnerId === workspace.currentUser.id;
                    const canReview = isIncoming && p.status === ProposalStatus.PENDING;
                    
                    return (
                        <div key={p.id} className="group p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-white/5 hover:border-amber-200 dark:hover:border-amber-900/50 transition-all">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{p.boothName}</h3>
                                        {getStatusBadge(p.status)}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {p.requester.displayName} &amp; {p.partner.displayName}
                                        </span>
                                        <span className="flex items-center gap-1 font-mono text-emerald-600 font-bold">
                                            <ArrowUpRight className="w-3 h-3" />
                                            Rp {formatGroupedNumber(p.requesterCapital + p.partnerCapital)}
                                        </span>
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded tracking-tighter uppercase font-bold text-[9px]">
                                            {p.packageType}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 self-end md:self-center">
                                    {canReview && (
                                        <ReviewProposalDialog 
                                            proposalId={p.id} 
                                            reviewerUserId={workspace.currentUser.id} 
                                            boothName={p.boothName} 
                                        />
                                    )}
                                    {!canReview && p.status === ProposalStatus.PENDING && (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                                            {isIncoming ? "Reviewed" : "Awaiting partner..."}
                                        </span>
                                    )}
                                    {p.status !== ProposalStatus.PENDING && (
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            {getStatusIcon(p.status)}
                                            <span className="text-xs font-medium uppercase tracking-tighter">Processed</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {p.notes && (
                                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] text-xs text-slate-500 italic border-l-2 border-slate-200">
                                    &quot;{p.notes}&quot;
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

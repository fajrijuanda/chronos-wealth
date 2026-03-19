"use client";

import { useState, useTransition } from "react";
import { useStatus } from "@/components/providers/StatusProvider";
import { reviewJointBoothProposal } from "@/actions/collaboration";
import { useRouter } from "next/navigation";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ReviewProposalDialog({ proposalId, reviewerUserId, boothName }: { proposalId: string, reviewerUserId: string, boothName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { showLoading, showSuccess, showError } = useStatus();
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleAction(decision: "approve" | "reject", formData: FormData) {
    const reviewerNote = String(formData.get("reviewerNote") ?? "");
    const isApprove = decision === "approve";

    startTransition(async () => {
        showLoading(isApprove ? "Menyetujui proposal..." : "Menolak proposal...");
        try {
            await reviewJointBoothProposal({
                proposalId,
                reviewerUserId,
                approve: isApprove,
                reviewerNote: reviewerNote || undefined,
            });
            showSuccess(`Proposal "${boothName}" berhasil ${isApprove ? 'disetujui' : 'ditolak'}.`);
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal memproses proposal.";
            showError(message);
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">Review</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-105">
        <DialogHeader>
          <DialogTitle>Tinjau Proposal Booth</DialogTitle>
        </DialogHeader>
        <form className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Catatan Review (Opsional)</label>
            <textarea
              title="Catatan review"
              name="reviewerNote"
              placeholder="Tambahkan pesan untuk partner Anda..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 min-h-25"
            />
          </div>

          <DialogFooter className="pt-4 flex justify-between!">
            <Button 
                type="button" 
                variant="outline" 
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                formAction={(fd) => handleAction("reject", fd)}
            >
              Reject
            </Button>
            <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                formAction={(fd) => handleAction("approve", fd)}
            >
              Approve & Purchase
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

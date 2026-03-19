"use client";

import { useState, useTransition } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStatus } from "@/components/providers/StatusProvider";
import { updateBooth, updateBoothOwnership } from "@/actions/collaboration";
import { useRouter } from "next/navigation";
import { Edit2 } from "lucide-react";

interface Asset {
    ownershipId: string;
    boothId: string;
    boothName: string;
    expectedMonthlyIncome: number;
    capitalAmount: number;
    revenueSharePct: number;
}

export function EditAssetDialog({ asset }: { asset: Asset }) {
  const [isOpen, setIsOpen] = useState(false);
  const { showLoading, showSuccess, showError } = useStatus();
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "");
    const expectedMonthlyIncome = Number(formData.get("expectedMonthlyIncome") ?? 0);
    const capitalAmount = Number(formData.get("capitalAmount") ?? 0);
    const revenueSharePct = Number(formData.get("revenueSharePct") ?? 0);

    if (!name || expectedMonthlyIncome < 0 || capitalAmount < 0) return;

    startTransition(async () => {
        showLoading("Memperbarui aset...");
        try {
            // Update booth info
            await updateBooth(asset.boothId, { name, expectedMonthlyIncome });
            // Update ownership info
            await updateBoothOwnership(asset.ownershipId, { capitalAmount, revenueSharePct });
            
            showSuccess("Aset berhasil diperbarui.");
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal memperbarui aset.";
            showError(message);
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex w-full items-center px-2 py-1.5 text-sm outline-hidden transition-colors focus:bg-slate-100 dark:focus:bg-slate-800 rounded-md">
            <Edit2 className="mr-2 h-4 w-4 text-slate-500" />
            Edit Asset
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Data Aset</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Booth</label>
            <input
              name="name"
              required
              defaultValue={asset.boothName}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Income (Rp)</label>
            <input
              name="expectedMonthlyIncome"
              type="number"
              required
              defaultValue={asset.expectedMonthlyIncome}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Modal Anda (Rp)</label>
            <input
              name="capitalAmount"
              type="number"
              required
              defaultValue={asset.capitalAmount}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Revenue Share (%)</label>
            <input
              name="revenueSharePct"
              type="number"
              step="0.01"
              required
              defaultValue={asset.revenueSharePct}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Update Asset
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

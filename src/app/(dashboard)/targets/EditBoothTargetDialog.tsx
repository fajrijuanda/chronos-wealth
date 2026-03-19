"use client";

import { useState, useTransition } from "react";
import { Edit2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStatus } from "@/components/providers/StatusProvider";
import { setUserTargetByEmail } from "@/actions/collaboration";
import { useRouter } from "next/navigation";

export function EditBoothTargetDialog({ 
    email, 
    currentTarget, 
    currentRevenue 
}: { 
    email: string, 
    currentTarget: number, 
    currentRevenue: number 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { showLoading, showSuccess, showError } = useStatus();
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const targetBoothEquivalent = Number(formData.get("targetBoothEquivalent") ?? 0);
    const revenuePerBooth = Number(formData.get("revenuePerBooth") ?? 0);

    if (targetBoothEquivalent <= 0 || revenuePerBooth <= 0) return;

    startTransition(async () => {
        showLoading("Memperbarui target booth...");
        try {
            await setUserTargetByEmail({
                email,
                targetBoothEquivalent,
                revenuePerBooth
            });
            showSuccess("Target booth berhasil diperbarui.");
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal memperbarui target.";
            showError(message);
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 rounded-lg gap-1 border-indigo-200 dark:border-indigo-900 bg-white/50 dark:bg-black/20 text-indigo-600 dark:text-indigo-400">
            <Edit2 className="w-3.5 h-4" />
            Edit Target
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Update Booth Target</DialogTitle>
          <DialogDescription>
            Target ini membantu memvisualisasikan progres pasif income Anda.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Berapa Target Booth Yang Ingin Dicapai?</label>
            <input
              name="targetBoothEquivalent"
              type="number"
              min={1}
              required
              defaultValue={currentTarget}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Asumsi Profit/Revenue Per Booth (Rp)</label>
            <input
              name="revenuePerBooth"
              type="number"
              min={1}
              required
              defaultValue={currentRevenue}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Update Target
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

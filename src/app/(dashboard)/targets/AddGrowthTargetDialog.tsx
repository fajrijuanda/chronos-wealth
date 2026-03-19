"use client";

import { useState, useTransition } from "react";
import { PlusCircle } from "lucide-react";
import { GrowthTargetKind } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStatus } from "@/components/providers/StatusProvider";
import { createGrowthTargetByEmail } from "@/actions/growth-target";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddGrowthTargetDialog({ email }: { email: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [kind, setKind] = useState<GrowthTargetKind>(GrowthTargetKind.CAPITAL_POOL);
  const [isPending, startTransition] = useTransition();
  const { showLoading, showSuccess, showError } = useStatus();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const targetValue = Number(formData.get("targetValue") ?? 0);
    const currentValue = Number(formData.get("currentValue") ?? 0);
    const unit = String(formData.get("unit") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();
    const deadlineRaw = String(formData.get("deadline") ?? "").trim();

    startTransition(async () => {
      showLoading("Menambahkan growth target...");
      try {
        await createGrowthTargetByEmail({
          email,
          kind,
          title,
          targetValue,
          currentValue,
          unit,
          note: note || undefined,
          deadline: deadlineRaw ? new Date(deadlineRaw) : null,
        });
        showSuccess("Growth target berhasil ditambahkan.");
        setIsOpen(false);
        router.refresh();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menambahkan growth target.";
        showError(message);
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl shadow-md bg-sky-600 hover:bg-sky-700 text-white gap-2">
          <PlusCircle className="h-4 w-4" />
          New Growth Target
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Growth Target</DialogTitle>
          <DialogDescription>
            Tambahkan target non-booth seperti jumlah rekening, modal terkumpul, atau target custom.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Jenis Target</label>
            <input type="hidden" name="kind" value={kind} />
            <Select value={kind} onValueChange={(value) => setKind(value as GrowthTargetKind)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih jenis target" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GrowthTargetKind.CAPITAL_POOL}>Modal Terkumpul</SelectItem>
                <SelectItem value={GrowthTargetKind.ACCOUNT_COUNT}>Jumlah Rekening/Akun</SelectItem>
                <SelectItem value={GrowthTargetKind.CUSTOM}>Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium">Judul</label>
              <input name="title" required placeholder="Contoh: Kumpulkan modal 500 juta" className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2 dark:border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Value</label>
              <input name="targetValue" type="number" min={1} required className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2 dark:border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Value</label>
              <input name="currentValue" type="number" min={0} defaultValue={0} className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2 dark:border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit</label>
              <input name="unit" required placeholder="Rp / akun / unit" className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2 dark:border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline (Opsional)</label>
              <input name="deadline" type="date" className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2 dark:border-slate-800" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Catatan (Opsional)</label>
            <textarea name="note" rows={3} className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2 dark:border-slate-800" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-sky-600 hover:bg-sky-700 text-white">
              {isPending ? "Saving..." : "Save Target"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Settings } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStatus } from "@/components/providers/StatusProvider";
import { setBudgetLimit } from "@/actions/budget";
import { useRouter } from "next/navigation";

export function BudgetSettingsDialog({ categories }: { 
    categories: { category: string, maxLimit: number, warningThreshold: number }[] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState<string>(categories[0]?.category ?? "");
  const { showLoading, showSuccess, showError } = useStatus();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const category = String(formData.get("category") ?? "");
    const maxLimit = Number(formData.get("maxLimit") ?? 0);
    const warningThreshold = Number(formData.get("warningThreshold") ?? 0);

    startTransition(async () => {
        showLoading("Menyesuaikan budget...");
        try {
            await setBudgetLimit({
                category,
                maxLimit,
                warningThreshold,
            });
            showSuccess("Limit budget berhasil diperbarui.");
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal mengatur budget.";
            showError(message);
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm font-medium h-auto">
          <Settings className="w-4 h-4" />
          Budget Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-112.5">
        <DialogHeader>
          <DialogTitle>Budget Settings</DialogTitle>
          <DialogDescription>
            Tentukan limit bulanan maksimum dan ambang batas peringatan untuk masing-masing pengeluaran.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Kategori</label>
            <input type="hidden" name="category" value={categoryValue} />
            <Select value={categoryValue} onValueChange={setCategoryValue}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.category} value={c.category}>
                    {c.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Batas Maksimum (Rp)</label>
              <input
                name="maxLimit"
                type="number"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                placeholder="Limit bulanan"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ambang Peringatan (%)</label>
              <input
                name="warningThreshold"
                type="number"
                required
                defaultValue={80}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                placeholder="80% misal"
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100">
              {isPending ? "Updating..." : "Update Settings"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

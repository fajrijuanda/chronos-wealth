"use client";

import { useState, useTransition } from "react";
import { PlusCircle } from "lucide-react";
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
import { createSavingGoal } from "@/actions/saving";
import { useRouter } from "next/navigation";

export function AddSavingGoalDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { showLoading, showSuccess, showError } = useStatus();
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "");
    const targetAmount = Number(formData.get("targetAmount") ?? 0);
    const deadlineStr = String(formData.get("deadline") ?? "");
    const priority = Number(formData.get("priority") ?? 1);

    if (!name || targetAmount <= 0 || !deadlineStr) return;

    startTransition(async () => {
        showLoading("Menyimpan target baru...");
        try {
            await createSavingGoal({
                name,
                targetAmount,
                deadline: new Date(deadlineStr),
                priority
            });
            showSuccess("Target tabungan berhasil ditambahkan.");
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menambahkan target.";
            showError(message);
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl shadow-md bg-purple-600 hover:bg-purple-700 text-white gap-2">
            <PlusCircle className="w-4 h-4" />
            New Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <DialogTitle>Add New Saving Goal</DialogTitle>
          <DialogDescription>
            Masukkan tujuan tabungan baru Anda di sini.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Target</label>
            <input
              title="Nama target tabungan"
              name="name"
              required
              placeholder="Contoh: Haji Orang Tua, Mobil Baru"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Target Dana (Rp)</label>
            <input
              title="Target dana"
              name="targetAmount"
              type="number"
              required
              placeholder="0"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">Deadline</label>
                <input
                  title="Tanggal deadline"
                    name="deadline"
                    type="date"
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Prioritas (1-5)</label>
                <input
                  title="Prioritas target"
                    name="priority"
                    type="number"
                    min={1}
                    max={5}
                    defaultValue={1}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
              Create Goal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

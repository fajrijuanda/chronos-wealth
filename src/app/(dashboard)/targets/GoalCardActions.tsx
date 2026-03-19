"use client";

import { useState, useTransition } from "react";
import { Edit2, Trash2, MoreVertical, Plus } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStatus } from "@/components/providers/StatusProvider";
import { deleteSavingGoal, updateSavingGoal, updateSavingGoalProgress } from "@/actions/saving";
import { useRouter } from "next/navigation";

interface SavingGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: Date;
    priority: number;
}

export function GoalCardActions({ goal }: { goal: SavingGoal }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { showConfirm, showLoading, showSuccess, showError } = useStatus();
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    showConfirm({
      title: "Hapus Target Tabungan?",
      message: `Apakah Anda yakin ingin menghapus "${goal.name}"? Data ini tidak dapat dikembalikan.`,
      confirmLabel: "Hapus",
      onConfirm: () => {
        startTransition(async () => {
          showLoading("Menghapus target...");
          try {
            await deleteSavingGoal(goal.id);
            showSuccess("Target tabungan berhasil dihapus.");
            router.refresh();
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menghapus target.";
            showError(message);
          }
        });
      },
    });
  };

  async function handleUpdate(formData: FormData) {
    const name = String(formData.get("name") ?? "");
    const targetAmount = Number(formData.get("targetAmount") ?? 0);
    const deadlineStr = String(formData.get("deadline") ?? "");
    const priority = Number(formData.get("priority") ?? 1);
    const currentAmount = Number(formData.get("currentAmount") ?? 0);

    startTransition(async () => {
        showLoading("Memperbarui target...");
        try {
            await updateSavingGoal(goal.id, {
                name,
                targetAmount,
                currentAmount,
                deadline: new Date(deadlineStr),
                priority
            });
            showSuccess("Target tabungan berhasil diperbarui.");
            setIsEditOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal memperbarui target.";
            showError(message);
        }
    });
  }

  async function handleAddProgress(formData: FormData) {
    const amount = Number(formData.get("amount") ?? 0);
    if (amount <= 0) return;

    startTransition(async () => {
        showLoading("Menabung...");
        try {
            await updateSavingGoalProgress(goal.id, amount);
            showSuccess(`Berhasil menabung Rp ${amount.toLocaleString()}.`);
            setIsAddOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menabung.";
            showError(message);
        }
    });
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Button 
            variant="outline" 
            size="sm" 
            className="h-8 rounded-lg text-xs gap-1 border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400"
            onClick={() => setIsAddOpen(true)}
        >
            <Plus className="w-3.5 h-3.5" />
            Add Fund
        </Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                <MoreVertical className="h-4 w-4 text-slate-400" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="hover:bg-slate-100 dark:hover:bg-slate-800">
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Goal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-120">
          <DialogHeader>
            <DialogTitle>Edit Saving Goal</DialogTitle>
          </DialogHeader>
          <form action={handleUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Target</label>
              <input
                title="Nama target"
                name="name"
                required
                defaultValue={goal.name}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Target Dana (Rp)</label>
                    <input
                      title="Target dana"
                        name="targetAmount"
                        type="number"
                        required
                        defaultValue={goal.targetAmount}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Sudah Terkumpul (Rp)</label>
                    <input
                      title="Dana terkumpul"
                        name="currentAmount"
                        type="number"
                        required
                        defaultValue={goal.currentAmount}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Deadline</label>
                    <input
                      title="Deadline target"
                        name="deadline"
                        type="date"
                        required
                        defaultValue={new Date(goal.deadline).toISOString().slice(0, 10)}
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
                        defaultValue={goal.priority}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Fund Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-100">
          <DialogHeader>
            <DialogTitle>Add Fund to {goal.name}</DialogTitle>
          </DialogHeader>
          <form action={handleAddProgress} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jumlah Nabung (Rp)</label>
              <input
                title="Nominal tabungan"
                name="amount"
                type="number"
                required
                autoFocus
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-lg font-semibold"
              />
              <p className="text-xs text-slate-500 italic">Jumlah ini akan ditambahkan ke dana yang sudah terkumpul.</p>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                Confirm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

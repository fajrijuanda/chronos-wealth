"use client";

import { useState, useTransition } from "react";
import { Edit2, MoreVertical, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useStatus } from "@/components/providers/StatusProvider";
import {
  addGrowthTargetProgress,
  deleteGrowthTarget,
  updateGrowthTarget,
} from "@/actions/growth-target";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function GrowthTargetCardActions({
  target,
}: {
  target: {
    id: string;
    title: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    note: string | null;
    deadline: Date | null;
  };
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [, startTransition] = useTransition();
  const { showLoading, showSuccess, showError, showConfirm } = useStatus();
  const router = useRouter();

  const onDelete = () => {
    showConfirm({
      title: "Hapus target?",
      message: `Target ${target.title} akan dihapus permanen.`,
      confirmLabel: "Hapus",
      onConfirm: () => {
        startTransition(async () => {
          showLoading("Menghapus target...");
          try {
            await deleteGrowthTarget(target.id);
            showSuccess("Target berhasil dihapus.");
            router.refresh();
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menghapus target.";
            showError(message);
          }
        });
      },
    });
  };

  async function onUpdate(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const targetValue = Number(formData.get("targetValue") ?? 0);
    const currentValue = Number(formData.get("currentValue") ?? 0);
    const unit = String(formData.get("unit") ?? "").trim();
    const note = String(formData.get("note") ?? "").trim();
    const deadlineRaw = String(formData.get("deadline") ?? "").trim();

    startTransition(async () => {
      showLoading("Menyimpan perubahan target...");
      try {
        await updateGrowthTarget({
          id: target.id,
          title,
          targetValue,
          currentValue,
          unit,
          note: note || null,
          deadline: deadlineRaw ? new Date(deadlineRaw) : null,
        });
        showSuccess("Target berhasil diperbarui.");
        setIsEditOpen(false);
        router.refresh();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal memperbarui target.";
        showError(message);
      }
    });
  }

  async function onAddProgress(formData: FormData) {
    const amount = Number(formData.get("amount") ?? 0);
    if (amount <= 0) return;

    startTransition(async () => {
      showLoading("Menambah progres...");
      try {
        await addGrowthTargetProgress(target.id, amount);
        showSuccess("Progres target berhasil ditambahkan.");
        setIsAddOpen(false);
        router.refresh();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menambah progres.";
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
          className="h-8 rounded-lg gap-1 border-sky-200 bg-sky-50/50 text-sky-600 dark:border-sky-900 dark:bg-sky-950/20 dark:text-sky-400"
          onClick={() => setIsAddOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Progress
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
              <MoreVertical className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl border border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
            <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
              <Edit2 className="mr-2 h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-rose-600">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Growth Target</DialogTitle>
          </DialogHeader>
          <form action={onUpdate} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Judul</label>
              <input name="title" defaultValue={target.title} required className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2 dark:border-slate-800" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Value</label>
                <input name="targetValue" type="number" min={1} required defaultValue={target.targetValue} className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2 dark:border-slate-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Value</label>
                <input name="currentValue" type="number" min={0} required defaultValue={target.currentValue} className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2 dark:border-slate-800" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit</label>
              <input name="unit" required defaultValue={target.unit} className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2 dark:border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline</label>
              <input name="deadline" type="date" defaultValue={target.deadline ? new Date(target.deadline).toISOString().slice(0, 10) : ""} className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2 dark:border-slate-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan</label>
              <textarea name="note" rows={3} defaultValue={target.note ?? ""} className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2 dark:border-slate-800" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white">Update</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tambah Progres {target.title}</DialogTitle>
          </DialogHeader>
          <form action={onAddProgress} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nilai Tambahan ({target.unit})</label>
              <input name="amount" type="number" min={1} required className="w-full rounded-xl border border-slate-200 bg-transparent px-4 py-2 dark:border-slate-800" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">Confirm</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

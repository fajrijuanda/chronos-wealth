"use client";

import { useTransition } from "react";
import { Trash2, MoreHorizontal, Power, PowerOff } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useStatus } from "@/components/providers/StatusProvider";
import { deleteIncomeSource, toggleIncomeSourceActive } from "@/actions/income";
import { useRouter } from "next/navigation";
import { EditIncomeDialog } from "./EditIncomeDialog";
import { CategoryType } from "@prisma/client";

interface IncomeData {
    id: string;
    name: string;
    amount: number;
    category: CategoryType;
    isRecurring: boolean;
    payoutDate: number | null;
    expectedDate: Date | null;
    isActive: boolean;
}

export function IncomeTableRowActions({ income }: { income: IncomeData }) {
  const { showConfirm, showLoading, showSuccess, showError } = useStatus();
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    showConfirm({
      title: "Hapus Sumber Pendapatan?",
      message: `Apakah Anda yakin ingin menghapus "${income.name}"? Data ini akan hilang dari simulasi.`,
      confirmLabel: "Hapus",
      onConfirm: () => {
        startTransition(async () => {
          showLoading("Menghapus pendapatan...");
          try {
            await deleteIncomeSource(income.id);
            showSuccess("Sumber pendapatan berhasil dihapus.");
            router.refresh();
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menghapus pendapatan.";
            showError(message);
          }
        });
      },
    });
  };

  const handleToggleActive = () => {
    startTransition(async () => {
      showLoading(`${income.isActive ? "Menonaktifkan" : "Mengaktifkan"} pendapatan...`);
      try {
        await toggleIncomeSourceActive(income.id, !income.isActive);
        showSuccess(`Berhasil ${income.isActive ? "dinonaktifkan" : "diaktifkan"}.`);
        router.refresh();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal mengubah status.";
        showError(message);
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      <EditIncomeDialog income={income} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <DropdownMenuItem onClick={handleToggleActive} className="hover:bg-slate-100 dark:hover:bg-slate-800">
            {income.isActive ? (
                <>
                    <PowerOff className="mr-2 h-4 w-4 text-orange-500" />
                    Deactivate
                </>
            ) : (
                <>
                    <Power className="mr-2 h-4 w-4 text-emerald-500" />
                    Activate
                </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

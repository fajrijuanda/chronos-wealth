"use client";

import { useTransition } from "react";
import { Trash2, MoreHorizontal, Target } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useStatus } from "@/components/providers/StatusProvider";
import { deleteBoothOwnership, setSimulationBaseBoothByEmail } from "@/actions/collaboration";
import { useRouter } from "next/navigation";
import { BoothPackageType } from "@prisma/client";
import { EditAssetDialog } from "./EditAssetDialog";

export function AssetTableRowActions({ 
    email, 
    ownershipId, 
    boothId, 
    boothName, 
    packageType,
    expectedMonthlyIncome,
    capitalAmount,
    revenueSharePct 
}: { 
    email: string, 
    ownershipId: string, 
    boothId: string, 
    boothName: string,
    packageType: BoothPackageType,
    expectedMonthlyIncome: number,
    capitalAmount: number,
    revenueSharePct: number
}) {
  const { showConfirm, showLoading, showSuccess, showError } = useStatus();
  const [, startTransition] = useTransition();
  const router = useRouter();

  const asset = {
    ownershipId,
    boothId,
    boothName,
    expectedMonthlyIncome,
    capitalAmount,
    revenueSharePct
  };

  const handleDelete = () => {
    showConfirm({
      title: "Hapus dari Portofolio?",
      message: `Apakah Anda yakin ingin menghapus "${boothName}"? Data kepemilikan Anda akan dihapus dari simulasi.`,
      confirmLabel: "Hapus",
      onConfirm: () => {
        startTransition(async () => {
          showLoading("Menghapus kepemilikan...");
          try {
            await deleteBoothOwnership(ownershipId);
            showSuccess("Aset berhasil dihapus dari portofolio.");
            router.refresh();
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menghapus aset.";
            showError(message);
          }
        });
      },
    });
  };

  const handleSetBase = () => {
    startTransition(async () => {
      showLoading("Mengatur harga dasar...");
      try {
        await setSimulationBaseBoothByEmail({ email, boothId });
        showSuccess(`"${boothName}" sekarang menjadi acuan harga dasar.`);
        router.refresh();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal mengatur harga dasar.";
        showError(message);
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
        <EditAssetDialog asset={asset} />
        {packageType !== BoothPackageType.EXCLUSIVE && (
            <DropdownMenuItem onClick={handleSetBase} className="hover:bg-slate-100 dark:hover:bg-slate-800">
                <Target className="mr-2 h-4 w-4 text-indigo-600" />
                Use as Base Price
            </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleDelete} className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
          <Trash2 className="mr-2 h-4 w-4" />
          Remove Asset
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

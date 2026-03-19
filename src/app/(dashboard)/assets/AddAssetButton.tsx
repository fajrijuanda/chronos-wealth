"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStatus } from "@/components/providers/StatusProvider";
import { createJointBoothProposalByEmail } from "@/actions/collaboration";
import { BoothPackageType, BoothSelectionType } from "@prisma/client";
import { useRouter } from "next/navigation";

export function AddAssetButton({ email, basePrice }: { email: string, basePrice: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const { showLoading, showSuccess, showError } = useStatus();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "");
    const price = Number(formData.get("price") ?? 0);
    const income = Number(formData.get("income") ?? 0);
    const packageType = formData.get("packageType") === "EXCLUSIVE" ? BoothPackageType.EXCLUSIVE : BoothPackageType.ECONOMY;

    startTransition(async () => {
        showLoading("Menambahkan asset ke portofolio...");
        try {
            await createJointBoothProposalByEmail({
                requesterEmail: email,
                partnerEmail: email, // Self purchase
                boothName: name,
                boothPrice: price,
                requesterAvailableBalance: price, // Assume balance enough for direct add
                partnerBoothPrice: 0,
                expectedMonthlyIncome: income,
                packageType,
                selectedBoothType: BoothSelectionType.NEW_BOOTH,
            });
            showSuccess("Asset baru berhasil ditambahkan ke portofolio.");
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menambahkan asset.";
            showError(message);
        }
    });
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 h-auto"
      >
        <Plus className="w-4 h-4" />
        Add Asset
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Tambahkan booth baru ke dalam portofolio asetmu secara manual.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Booth</label>
              <input
                name="name"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                placeholder="Booth Ekonomi 01"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Harga Beli (Rp)</label>
                <input
                  name="price"
                  type="number"
                  required
                  defaultValue={basePrice}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Income Bulanan (Rp)</label>
                <input
                  name="income"
                  type="number"
                  required
                  defaultValue={1000000}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipe Paket</label>
              <select
                name="packageType"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
              >
                <option value="ECONOMY">Ekonomi</option>
                <option value="EXCLUSIVE">Eksklusif</option>
              </select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isPending ? "Saving..." : "Save Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

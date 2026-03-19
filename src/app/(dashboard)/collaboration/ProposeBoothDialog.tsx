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
import { createJointBoothProposalByEmail } from "@/actions/collaboration";
import { useRouter } from "next/navigation";
import { BoothPackageType, BoothSelectionType } from "@prisma/client";

export function ProposeBoothDialog({ 
    email, 
    basePrice, 
    friends 
}: { 
    email: string, 
    basePrice: number, 
    friends: Array<{ email: string, name: string }> 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { showLoading, showSuccess, showError } = useStatus();
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const partnerEmail = String(formData.get("partnerEmail") ?? "");
    const boothName = String(formData.get("boothName") ?? "");
    const boothPrice = Number(formData.get("boothPrice") ?? 0);
    const requesterAvailableBalance = Number(formData.get("requesterAvailableBalance") ?? 0);
    const partnerBoothPrice = Number(formData.get("partnerBoothPrice") ?? 0);
    const expectedMonthlyIncome = Number(formData.get("expectedMonthlyIncome") ?? 0);
    const packageType = formData.get("packageType") as BoothPackageType;
    const mouSignedAtRaw = String(formData.get("mouSignedAt") ?? "");
    const referralEconomyBooths = Number(formData.get("referralEconomyBooths") ?? 0);
    const selectedBoothType = formData.get("selectedBoothType") as BoothSelectionType;
    const notes = String(formData.get("notes") ?? "");

    if (!partnerEmail || !boothName || boothPrice <= 0) return;

    startTransition(async () => {
        showLoading("Memproses pengajuan booth...");
        try {
            const result = await createJointBoothProposalByEmail({
                requesterEmail: email,
                partnerEmail,
                boothName,
                boothPrice,
                requesterAvailableBalance,
                partnerBoothPrice,
                expectedMonthlyIncome,
                packageType,
                mouSignedAt: mouSignedAtRaw ? new Date(mouSignedAtRaw) : undefined,
                referralEconomyBooths,
                selectedBoothType,
                notes: notes || undefined,
            });

            const msg = result.mode === "SELF_PURCHASE" 
                ? "Booth berhasil dibeli secara penuh." 
                : `Proposal kolaborasi telah dikirim ke ${partnerEmail}.`;
            
            showSuccess(msg);
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal memproses proposal.";
            showError(message);
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl shadow-md bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <PlusCircle className="w-4 h-4" />
            Buy / Propose Booth
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajukan Pembelian / Kolaborasi Booth</DialogTitle>
          <DialogDescription>
            Sistem otomatis membuat proposal kolaborasi jika saldo Anda tidak mencukupi untuk membeli secara penuh.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Basic Info</h4>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Partner Kolaborasi</label>
                    <select
                        name="partnerEmail"
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    >
                        {friends.map(f => (
                            <option key={f.email} value={f.email}>{f.name} ({f.email})</option>
                        ))}
                        {friends.length === 0 && <option value="" disabled>Tambahkan partner terlebih dahulu</option>}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Nama Booth</label>
                    <input
                        name="boothName"
                        required
                        placeholder="Contoh: Booth Durian Kemayoran"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Booth Price (Rp)</label>
                    <input
                        name="boothPrice"
                        type="number"
                        defaultValue={basePrice}
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Financial Simulation</h4>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Saldo Cash Anda (Rp)</label>
                    <input
                        name="requesterAvailableBalance"
                        type="number"
                        min={0}
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                    <p className="text-[10px] text-slate-400 italic">Sistem akan membagi sisa modal ke partner Anda sesuai harga dasar booth mereka.</p>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Booth Price di Partner (Rp)</label>
                    <input
                        name="partnerBoothPrice"
                        type="number"
                        defaultValue={9500000}
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Target Monthly Income (Rp)</label>
                    <input
                        name="expectedMonthlyIncome"
                        type="number"
                        defaultValue={1000000}
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Advanced Ops</h4>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Package Type</label>
                    <select
                        name="packageType"
                        defaultValue={BoothPackageType.ECONOMY}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    >
                        <option value={BoothPackageType.ECONOMY}>Economy (Payout H+1)</option>
                        <option value={BoothPackageType.EXCLUSIVE}>Exclusive 20jt (Payout OnDate)</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">MoU Signing Date</label>
                    <input
                        name="mouSignedAt"
                        type="date"
                        defaultValue={new Date().toISOString().slice(0, 10)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Referrals & Notes</h4>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Referral Economy Booths</label>
                    <input
                        name="referralEconomyBooths"
                        type="number"
                        min={0}
                        defaultValue={0}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                    <p className="text-[10px] text-slate-400 italic">Komisi Rp 50.000 x Jumlah Booth (khusus Economy).</p>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Booth Selection Type</label>
                    <select
                        name="selectedBoothType"
                        defaultValue={BoothSelectionType.NEW_BOOTH}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    >
                        <option value={BoothSelectionType.NEW_BOOTH}>Beli Booth Baru</option>
                        <option value={BoothSelectionType.EXISTING_BOOTH}>Upgrade / Booth Sudah Ada</option>
                    </select>
                </div>
            </div>
          </div>

          <DialogFooter className="pt-4 sticky bottom-0 bg-white dark:bg-slate-900 py-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Buy / Submit Proposal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

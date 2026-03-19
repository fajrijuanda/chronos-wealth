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
    friends,
    disabled = false,
}: { 
    email: string, 
    basePrice: number, 
    friends: Array<{ email: string, name: string }>,
    disabled?: boolean,
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
                <Button disabled={disabled} className="rounded-2xl shadow-md bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    <PlusCircle className="w-4 h-4" />
                    Buy / Propose Booth
        </Button>
      </DialogTrigger>
            <DialogContent className="sm:max-w-175 max-h-[95vh] overflow-y-auto">
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
                                        <label htmlFor="proposal-partner-email" className="text-sm font-medium">Partner Kolaborasi</label>
                    <select
                                                id="proposal-partner-email"
                        name="partnerEmail"
                                                title="Pilih partner kolaborasi"
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    >
                                            {friends.length > 0 ? (
                                                friends.map((f) => (
                                                    <option key={f.email} value={f.email}>{f.name} ({f.email})</option>
                                                ))
                                            ) : (
                                                <option value="" disabled>Tambahkan partner terlebih dahulu</option>
                                            )}
                    </select>
                                        {friends.length === 0 ? (
                                            <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                                Belum ada partner accepted. Hubungkan user lain dulu di tab Connect.
                                            </p>
                                        ) : null}
                </div>
                <div className="space-y-2">
                                        <label htmlFor="proposal-booth-name" className="text-sm font-medium">Nama Booth</label>
                    <input
                                                id="proposal-booth-name"
                        name="boothName"
                        required
                        placeholder="Contoh: Booth Durian Kemayoran"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="proposal-booth-price" className="text-sm font-medium">Booth Price (Rp)</label>
                    <input
                        id="proposal-booth-price"
                        name="boothPrice"
                        title="Masukkan harga booth"
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
                    <label htmlFor="proposal-requester-balance" className="text-sm font-medium">Saldo Cash Anda (Rp)</label>
                    <input
                        id="proposal-requester-balance"
                        name="requesterAvailableBalance"
                        title="Masukkan saldo cash Anda"
                        type="number"
                        min={0}
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                    <p className="text-[10px] text-slate-400 italic">Sistem akan membagi sisa modal ke partner Anda sesuai harga dasar booth mereka.</p>
                </div>
                <div className="space-y-2">
                    <label htmlFor="proposal-partner-booth-price" className="text-sm font-medium">Booth Price di Partner (Rp)</label>
                    <input
                        id="proposal-partner-booth-price"
                        name="partnerBoothPrice"
                        title="Masukkan harga booth acuan partner"
                        type="number"
                        defaultValue={9500000}
                        required
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                </div>
                <div className="space-y-2">
                    <label htmlFor="proposal-monthly-income" className="text-sm font-medium">Target Monthly Income (Rp)</label>
                    <input
                        id="proposal-monthly-income"
                        name="expectedMonthlyIncome"
                        title="Masukkan target income bulanan"
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
                    <label htmlFor="proposal-package-type" className="text-sm font-medium">Package Type</label>
                    <select
                        id="proposal-package-type"
                        name="packageType"
                        title="Pilih jenis paket booth"
                        defaultValue={BoothPackageType.ECONOMY}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    >
                        <option value={BoothPackageType.ECONOMY}>Economy (Payout H+1)</option>
                        <option value={BoothPackageType.EXCLUSIVE}>Exclusive 20jt (Payout OnDate)</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label htmlFor="proposal-mou-signed-at" className="text-sm font-medium">MoU Signing Date</label>
                    <input
                        id="proposal-mou-signed-at"
                        name="mouSignedAt"
                        title="Pilih tanggal tanda tangan MoU"
                        type="date"
                        defaultValue={new Date().toISOString().slice(0, 10)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Referrals & Notes</h4>
                <div className="space-y-2">
                    <label htmlFor="proposal-referral-economy" className="text-sm font-medium">Referral Economy Booths</label>
                    <input
                        id="proposal-referral-economy"
                        name="referralEconomyBooths"
                        title="Masukkan jumlah booth referral ekonomi"
                        type="number"
                        min={0}
                        defaultValue={0}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                    <p className="text-[10px] text-slate-400 italic">Komisi Rp 50.000 x Jumlah Booth (khusus Economy).</p>
                </div>
                <div className="space-y-2">
                    <label htmlFor="proposal-selection-type" className="text-sm font-medium">Booth Selection Type</label>
                    <select
                        id="proposal-selection-type"
                        name="selectedBoothType"
                        title="Pilih tipe pemilihan booth"
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
                        <Button type="submit" disabled={friends.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Buy / Submit Proposal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

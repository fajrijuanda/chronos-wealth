"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
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
import { sendFriendRequestByEmail } from "@/actions/collaboration";
import { useRouter } from "next/navigation";

export function AddFriendDialog({ requesterEmail }: { requesterEmail: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { showLoading, showSuccess, showError } = useStatus();
  const [, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const addresseeEmail = String(formData.get("addresseeEmail") ?? "");
    const partnerBasePrice = Number(formData.get("addresseeBoothBasePrice") ?? 0);

    if (!addresseeEmail) return;

    startTransition(async () => {
        showLoading("Mengirim permintaan pertemanan...");
        try {
            await sendFriendRequestByEmail({
                requesterEmail,
                addresseeEmail,
                addresseeBoothBasePrice: partnerBasePrice > 0 ? partnerBasePrice : undefined,
            });
            showSuccess(`Permintaan pertemanan dikirim ke ${addresseeEmail}.`);
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal mengirim permintaan.";
            showError(message);
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl shadow-md bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <UserPlus className="w-4 h-4" />
            Add Partner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Tambah Partner Kolaborasi</DialogTitle>
          <DialogDescription>
            Masukkan email teman Anda untuk mulai berkolaborasi dalam pembelian booth.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Teman</label>
            <input
              name="addresseeEmail"
              type="email"
              required
              placeholder="teman@domain.com"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Harga Dasar Booth Partner (Rp)</label>
            <input
              name="addresseeBoothBasePrice"
              type="number"
              defaultValue={9500000}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
            />
            <p className="text-[10px] text-slate-400 italic">Harga booth yang biasa dibeli oleh partner Anda.</p>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
              Send Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { createIncomeSourceByEmail } from "@/actions/income";
import { CategoryType } from "@prisma/client";
import { useRouter } from "next/navigation";

export function AddIncomeDialog({ email }: { email: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { showLoading, showSuccess, showError } = useStatus();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "");
    const amount = Number(formData.get("amount") ?? 0);
    const category = String(formData.get("category") ?? "SALARY") as CategoryType;
    const isRecurring = formData.get("isRecurring") === "on";
    const payoutDate = Number(formData.get("payoutDate") || 1);
    const expectedDateStr = String(formData.get("expectedDate") ?? "");

    startTransition(async () => {
        showLoading("Menambahkan sumber pendapatan...");
        try {
            await createIncomeSourceByEmail({
                ownerEmail: email,
                name,
                amount,
                category,
                isRecurring,
                payoutDate: isRecurring ? payoutDate : null,
                expectedDate: !isRecurring && expectedDateStr ? new Date(expectedDateStr) : null,
            });
            showSuccess("Sumber pendapatan baru berhasil ditambahkan.");
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menambahkan pendapatan.";
            showError(message);
        }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl shadow-md bg-blue-600 hover:bg-blue-700 text-white gap-2 h-auto">
          <PlusCircle className="w-4 h-4" />
          Add Income
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add New Income Source</DialogTitle>
          <DialogDescription>
            Catat pendapatan rutin atau proyek sekali jalan untuk simulasi cashflow Anda.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Pendapatan</label>
            <input
              name="name"
              required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
              placeholder="Gaji Utama, Bonus Project, dll."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Jumlah (Rp)</label>
              <input
                name="amount"
                type="number"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                placeholder="5000000"
              />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">Kategori</label>
                <select
                    name="category"
                    required
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                >
                    <option value="SALARY">Salary</option>
                    <option value="PROJECT">Project / Freelance</option>
                    <option value="COMMISSION">Commission</option>
                    <option value="BOOTH">Booth Business</option>
                    <option value="STOCK">Dividen / Saham</option>
                    <option value="SAAS">SaaS Business</option>
                </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 py-2">
            <input 
                type="checkbox" 
                name="isRecurring" 
                id="isRecurring" 
                defaultChecked 
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor="isRecurring" className="text-sm font-medium">Rutin Bulanan (Recurring)</label>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium italic text-slate-500">Jika Rutin:</label>
                <div className="flex items-center gap-2">
                    <span className="text-sm">Dibayar setiap tanggal</span>
                    <input
                        name="payoutDate"
                        type="number"
                        min={1}
                        max={31}
                        defaultValue={25}
                        className="w-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1.5"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium italic text-slate-500">Jika Sekali Jalan:</label>
                <input
                    name="expectedDate"
                    type="date"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? "Saving..." : "Save Income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useTransition } from "react";
import { useStatus } from "@/components/providers/StatusProvider";
import { setManualBasePrice } from "@/actions/collaboration";
import { useRouter } from "next/navigation";

export function ManualPriceForm({ 
    email, 
    currentPrice 
}: { 
    email: string; 
    currentPrice: number 
}) {
  const { showLoading, showSuccess, showError, showConfirm } = useStatus();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const price = Number(formData.get("price") ?? 0);

    showConfirm({
      title: "Update Manual Price?",
      message: `Are you sure you want to change the simulation base price to Rp ${price.toLocaleString("id-ID")}?`,
      confirmLabel: "Update",
      onConfirm: () => {
        startTransition(async () => {
          showLoading("Updating manual price...");
          try {
            await setManualBasePrice(email, price);
            showSuccess("Manual simulation price has been updated successfully.");
            router.refresh();
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to update price.";
            showError(message);
          }
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="email" value={email} />
      <div>
        <label className="block text-sm font-medium mb-1 translate-x-1 text-slate-500">
            Harga Dasar Manual
        </label>
        <input
          name="price"
          type="number"
          defaultValue={currentPrice}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-black/20 px-4 py-2"
          placeholder="7,500,000"
          disabled={isPending}
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-slate-900 dark:bg-white dark:text-black text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center"
      >
        {isPending ? "Changing..." : "Update Manual Price"}
      </button>
    </form>
  );
}

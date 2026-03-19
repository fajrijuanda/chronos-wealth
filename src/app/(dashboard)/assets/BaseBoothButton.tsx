"use client";

import { useStatus } from "@/components/providers/StatusProvider";
import { setSimulationBaseBoothByEmail } from "@/actions/collaboration";
import { useRouter } from "next/navigation";

export function BaseBoothButton({ 
  email, 
  boothId, 
  boothName, 
  price 
}: { 
  email: string; 
  boothId: string; 
  boothName: string; 
  price: number; 
}) {
  const { showLoading, showSuccess, showError, showConfirm } = useStatus();
  const router = useRouter();

  const handleSetBase = () => {
    showConfirm({
      title: "Set As Base Price?",
      message: `Set ${boothName} (Rp ${price.toLocaleString('id-ID')}) as your global simulation base price?`,
      confirmLabel: "Set Price",
      onConfirm: async () => {
        showLoading(`Setting ${boothName} as base price...`);
        try {
          await setSimulationBaseBoothByEmail({ email, boothId });
          showSuccess(`${boothName} is now used as simulation base price.`);
          router.refresh();
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Failed to set base booth.";
          showError(message);
        }
      }
    });
  };

  return (
    <button
      onClick={handleSetBase}
      className="rounded-lg px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center justify-center disabled:opacity-50"
    >
      Set As Base Price
    </button>
  );
}

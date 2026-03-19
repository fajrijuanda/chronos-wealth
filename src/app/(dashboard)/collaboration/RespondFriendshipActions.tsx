"use client";

import { useTransition } from "react";
import { useStatus } from "@/components/providers/StatusProvider";
import { respondFriendRequest } from "@/actions/collaboration";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RespondFriendshipActions({ friendshipId, friendName }: { friendshipId: string, friendName: string }) {
  const { showConfirm, showLoading, showSuccess, showError } = useStatus();
  const [, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = (action: "accept" | "reject") => {
    const isAccept = action === "accept";
    showConfirm({
      title: isAccept ? "Terima Permintaan?" : "Tolak Permintaan?",
      message: isAccept 
        ? `Apakah Anda ingin menerima permintaan pertemanan dari ${friendName}?` 
        : `Apakah Anda ingin menolak permintaan pertemanan dari ${friendName}?`,
      confirmLabel: isAccept ? "Terima" : "Tolak",
      onConfirm: () => {
        startTransition(async () => {
          showLoading(isAccept ? "Menerima..." : "Menolak...");
          try {
            await respondFriendRequest(friendshipId, action);
            showSuccess(`Permintaan pertemanan dari ${friendName} ${isAccept ? 'diterima' : 'ditolak'}.`);
            router.refresh();
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal memproses permintaan.";
            showError(message);
          }
        });
      },
    });
  };

  return (
    <div className="flex gap-2">
      <Button 
        size="sm" 
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => handleAction("accept")}
      >
        Accept
      </Button>
      <Button 
        size="sm" 
        variant="outline" 
        className="text-rose-600 border-rose-200 hover:bg-rose-50"
        onClick={() => handleAction("reject")}
      >
        Reject
      </Button>
    </div>
  );
}

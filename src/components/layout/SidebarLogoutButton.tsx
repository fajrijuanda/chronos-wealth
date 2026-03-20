"use client";

import { useRef, useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStatus } from "@/components/providers/StatusProvider";

export function SidebarLogoutButton({
  action,
  compact = false,
  className,
}: {
  action: () => void | Promise<void>;
  compact?: boolean;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const { showConfirm, showLoading } = useStatus();

  const handleLogoutRequest = () => {
    showConfirm({
      title: "Yakin ingin keluar?",
      message: "Sesi kamu akan diakhiri dan kamu perlu login lagi.",
      confirmLabel: "Ya, Logout",
      cancelLabel: "Batal",
      onConfirm: () => {
        startTransition(() => {
          showLoading("Menutup sesi akun...");
          formRef.current?.requestSubmit();
        });
      },
    });
  };

  return (
    <>
      <form ref={formRef} action={action} className="hidden" />
      <Button
        type="button"
        variant="ghost"
        onClick={handleLogoutRequest}
        disabled={isPending}
        className={cn(
          "text-rose-600 hover:text-rose-600 hover:bg-rose-50/85 dark:hover:bg-rose-950/25",
          compact ? "h-10 w-10 rounded-xl p-0" : "h-10 justify-start rounded-xl px-3",
          className,
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogOut className="h-4 w-4" />
        )}
        {!compact ? <span className="ml-2 text-sm font-medium">{isPending ? "Logging out..." : "Logout"}</span> : null}
      </Button>
    </>
  );
}

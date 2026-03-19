"use client";

import { useRef, useTransition } from "react";
import { Loader2, LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useStatus } from "@/components/providers/StatusProvider";

type LogoutMenuItemProps = {
  action: () => void | Promise<void>;
};

export function LogoutMenuItem({ action }: LogoutMenuItemProps) {
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
      <DropdownMenuItem
        disabled={isPending}
        onSelect={(event) => {
          event.preventDefault();
          handleLogoutRequest();
        }}
        className="rounded-xl cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/30"
      >
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
        <span>{isPending ? "Logging out..." : "Logout"}</span>
      </DropdownMenuItem>
    </>
  );
}

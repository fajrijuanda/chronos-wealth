"use client";

import React, { useTransition } from "react";
import { useStatus } from "@/components/providers/StatusProvider";
import { useRouter } from "next/navigation";

interface ConfirmedFormProps {
  action: (formData: FormData) => Promise<void>;
  confirmTitle?: string;
  confirmMessage?: string;
  loadingMessage?: string;
  successMessage?: string;
  children: React.ReactNode;
  className?: string;
  confirmLabel?: string;
}

export function ConfirmedForm({
  action,
  confirmTitle = "Are you sure?",
  confirmMessage = "Do you want to proceed with this action?",
  loadingMessage = "Processing...",
  successMessage = "Action completed successfully.",
  children,
  className,
  confirmLabel = "Confirm",
}: ConfirmedFormProps) {
  const { showLoading, showSuccess, showError, showConfirm } = useStatus();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    showConfirm({
      title: confirmTitle,
      message: confirmMessage,
      confirmLabel,
      onConfirm: () => {
        startTransition(async () => {
          showLoading(loadingMessage);
          try {
            await action(formData);
            showSuccess(successMessage);
            router.refresh();
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Something went wrong";
            // If it's a NEXT_REDIRECT error, it means it's actually success but Next.js redirecting
            if (msg.includes("NEXT_REDIRECT")) {
                showSuccess(successMessage);
                router.refresh();
            } else {
                showError(msg);
            }
          }
        });
      },
    });
  };

  return (
    <form action={handleSubmit} className={className}>
      {/* Inject isPending into children if they are buttons */}
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const childProps = child.props as { type?: string; disabled?: boolean } | null;
          const isSubmitButton = child.type === "button" || childProps?.type === "submit";

          if (isSubmitButton) {
            return React.cloneElement(child as React.ReactElement<{ disabled?: boolean }>, {
              disabled: isPending || Boolean(childProps?.disabled),
            });
          }
        }
        return child;
      })}
    </form>
  );
}

"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { StatusModal, StatusType } from "@/components/ui/StatusModal";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

interface StatusContextType {
  showLoading: (message?: string, title?: string) => void;
  showSuccess: (message?: string, title?: string) => void;
  showError: (message?: string, title?: string) => void;
  showConfirm: (config: {
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
  }) => void;
  hideStatus: () => void;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<StatusType>(null);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [confirmConfig, setConfirmConfig] = useState<{
    onConfirm: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
  } | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const hideStatus = useCallback(() => {
    setIsOpen(false);
    // Clear ok/error from URl after closing
    const params = new URLSearchParams(searchParams.toString());
    if (params.has("ok") || params.has("error")) {
        params.delete("ok");
        params.delete("error");
        const query = params.toString();
        router.replace(`${pathname}${query ? `?${query}` : ""}`);
    }
  }, [searchParams, router, pathname]);

  const showLoading = useCallback((msg?: string, t?: string) => {
    setType("loading");
    setMessage(msg);
    setTitle(t);
    setIsOpen(true);
  }, []);

  const showSuccess = useCallback((msg?: string, t?: string) => {
    setType("success");
    setMessage(msg);
    setTitle(t);
    setIsOpen(true);
  }, []);

  const showError = useCallback((msg?: string, t?: string) => {
    setType("error");
    setMessage(msg);
    setTitle(t);
    setIsOpen(true);
  }, []);

  const showConfirm = useCallback((config: {
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
  }) => {
    setType("confirm");
    setTitle(config.title);
    setMessage(config.message);
    setConfirmConfig({
      onConfirm: config.onConfirm,
      confirmLabel: config.confirmLabel,
      cancelLabel: config.cancelLabel,
    });
    setIsOpen(true);
  }, []);

  // Sync with URL params
  useEffect(() => {
    const ok = searchParams.get("ok");
    const error = searchParams.get("error");

    if (ok) {
        setType("success");
        setMessage(ok);
        setTitle("Berhasil!");
        setIsOpen(true);
    } else if (error) {
        setType("error");
        setMessage(error);
        setTitle("Gagal");
        setIsOpen(true);
    }
  }, [searchParams]);

  return (
    <StatusContext.Provider value={{ showLoading, showSuccess, showError, showConfirm, hideStatus }}>
      {children}
      <StatusModal
        isOpen={isOpen}
        type={type}
        title={title}
        message={message}
        onClose={hideStatus}
        onConfirm={confirmConfig?.onConfirm}
        confirmLabel={confirmConfig?.confirmLabel}
        cancelLabel={confirmConfig?.cancelLabel}
      />
    </StatusContext.Provider>
  );
}

export function useStatus() {
  const context = useContext(StatusContext);
  if (!context) {
    throw new Error("useStatus must be used within a StatusProvider");
  }
  return context;
}

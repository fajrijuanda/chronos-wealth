"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, Suspense } from "react";
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

function StatusUrlHandler({ 
    setIsOpen, 
    setType, 
    setMessage, 
    setTitle 
}: { 
    setIsOpen: (v: boolean) => void, 
    setType: (t: StatusType) => void,
    setMessage: (v: string | undefined) => void,
    setTitle: (v: string | undefined) => void
}) {
  const searchParams = useSearchParams();

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
  }, [searchParams, setIsOpen, setType, setMessage, setTitle]);

  return null;
}

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

  const router = useRouter();
  const pathname = usePathname();

  const hideStatus = useCallback(() => {
    setIsOpen(false);
    // Clear ok/error from URl after closing
    // Since we need searchParams here, we can't easily move this part unless we move hideStatus
    // However, hideStatus is only called on user action, so it might be okay?
    // Actually, in hideStatus, we can construct URLSearchParams from window.location.search if needed, 
    // or just let it stay if it doesn't trigger the build error.
    // Let's try to make hideStatus not depend on useSearchParams directly at the top level.
    const params = new URLSearchParams(window.location.search);
    if (params.has("ok") || params.has("error")) {
        params.delete("ok");
        params.delete("error");
        const query = params.toString();
        router.replace(`${pathname}${query ? `?${query}` : ""}`);
    }
  }, [router, pathname]);

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

  return (
    <StatusContext.Provider value={{ showLoading, showSuccess, showError, showConfirm, hideStatus }}>
      <Suspense fallback={null}>
        <StatusUrlHandler 
            setIsOpen={setIsOpen} 
            setType={setType} 
            setMessage={setMessage} 
            setTitle={setTitle} 
        />
      </Suspense>
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

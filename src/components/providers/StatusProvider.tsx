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

const SUCCESS_MESSAGE_MAP: Record<string, string> = {
  saved: "Perubahan berhasil disimpan.",
  created: "Data berhasil ditambahkan.",
  updated: "Data berhasil diperbarui.",
  deleted: "Data berhasil dihapus.",
  accept: "Permintaan berhasil diterima.",
  reject: "Permintaan berhasil ditolak.",
  "request-sent": "Permintaan berhasil dikirim.",
  "email-updated": "Email akun berhasil diperbarui.",
  "account-deleted": "Akun berhasil dihapus.",
};

const ERROR_MESSAGE_MAP: Record<string, string> = {
  failed: "Proses gagal, silakan coba lagi.",
  "not-found": "Data tidak ditemukan.",
  unauthorized: "Anda tidak memiliki akses untuk aksi ini.",
  "validation-error": "Data yang dimasukkan belum valid.",
  "confirm-delete-required": "Ketik DELETE untuk mengonfirmasi penghapusan akun.",
};

function toSentenceCase(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function humanizeCode(raw: string) {
  return toSentenceCase(raw.replace(/[-_]+/g, " ").trim());
}

function normalizeStatusMessage(raw: string | null | undefined, kind: "success" | "error") {
  if (!raw) return undefined;

  const message = raw.trim();
  if (!message) return undefined;

  const normalizedKey = message.toLowerCase();
  const mapped =
    kind === "success"
      ? SUCCESS_MESSAGE_MAP[normalizedKey]
      : ERROR_MESSAGE_MAP[normalizedKey];

  if (mapped) return mapped;

  // If the message is a compact status code (e.g. request-sent), turn it into readable text.
  const looksLikeCode = !message.includes(" ") || /[-_]/.test(message);
  if (looksLikeCode) {
    const readable = humanizeCode(message);
    return kind === "success"
      ? `Berhasil: ${readable}.`
      : `Terjadi kendala: ${readable}.`;
  }

  return toSentenceCase(message);
}

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
        setMessage(normalizeStatusMessage(ok, "success"));
        setTitle("Berhasil!");
        setIsOpen(true);
    } else if (error) {
        setType("error");
        setMessage(normalizeStatusMessage(error, "error"));
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
    setMessage(normalizeStatusMessage(msg, "success"));
    setTitle(t);
    setIsOpen(true);
  }, []);

  const showError = useCallback((msg?: string, t?: string) => {
    setType("error");
    setMessage(normalizeStatusMessage(msg, "error"));
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

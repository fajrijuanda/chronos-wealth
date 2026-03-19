"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="relative w-full overflow-hidden rounded-2xl px-4 py-2.5 font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-80 bg-linear-to-r from-primary via-[#9399f0] to-primary hover:brightness-105 shadow-[0_14px_30px_-18px_rgba(125,132,226,0.9)]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent animate-shimmer-x"
      />
      <span className="relative flex items-center justify-center gap-2">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Memverifikasi akun...
          </>
        ) : (
          "Masuk ke Dashboard"
        )}
      </span>
    </button>
  );
}

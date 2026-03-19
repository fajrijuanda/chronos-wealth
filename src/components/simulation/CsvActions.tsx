"use client";

import { useMemo, useState } from "react";

type CsvActionsProps = {
  csvContent: string;
  fileName: string;
  downloadLabel?: string;
  copyLabel?: string;
  className?: string;
};

export function CsvActions({
  csvContent,
  fileName,
  downloadLabel = "Export CSV",
  copyLabel = "Copy CSV",
  className,
}: CsvActionsProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  const csvHref = useMemo(
    () => `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`,
    [csvContent],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(csvContent);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("error");
      setTimeout(() => setCopyState("idle"), 1800);
    }
  };

  return (
    <div className={className ?? "flex items-center gap-2"}>
      <a
        href={csvHref}
        download={fileName}
        className="inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        {downloadLabel}
      </a>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy Failed" : copyLabel}
      </button>
    </div>
  );
}

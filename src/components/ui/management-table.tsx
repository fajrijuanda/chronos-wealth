"use client";

import { type ReactNode, useMemo, useState } from "react";
import { Download, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ExportFormat = "csv" | "excel" | "json" | "pdf";

type TableFilter<T> = {
  value: string;
  label: string;
  predicate: (row: T) => boolean;
};

type TableColumn<T> = {
  key: string;
  label: string;
  className?: string;
  headerClassName?: string;
  render: (row: T) => ReactNode;
  exportValue?: (row: T) => string | number;
};

type ManagementTableProps<T extends { id: string }> = {
  title: string;
  subtitle?: string;
  rows: T[];
  columns: Array<TableColumn<T>>;
  searchableText: (row: T) => string;
  filters?: Array<TableFilter<T>>;
  actionSlot?: ReactNode;
  emptyMessage?: string;
  initialFilter?: string;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  exportFileName?: string;
};

function csvEscape(value: string) {
  return `"${String(value).replaceAll("\"", '""')}"`;
}

function toPlainText(value: unknown): string {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return String(value);
}

export function ManagementTable<T extends { id: string }>(props: ManagementTableProps<T>) {
  const {
    title,
    subtitle,
    rows,
    columns,
    searchableText,
    filters,
    actionSlot,
    emptyMessage,
    initialFilter = "all",
    pageSizeOptions = [10, 25, 50],
    defaultPageSize = 10,
    exportFileName = "table-export",
  } = props;

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  const normalizedQuery = query.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    const filterDef = filters?.find((item) => item.value === activeFilter);

    return rows.filter((row) => {
      const passFilter = filterDef ? filterDef.predicate(row) : true;
      const passSearch = normalizedQuery.length === 0
        ? true
        : searchableText(row).toLowerCase().includes(normalizedQuery);

      return passFilter && passSearch;
    });
  }, [rows, filters, activeFilter, normalizedQuery, searchableText]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  const pageRowIds = pagedRows.map((item) => item.id);
  const allPageSelected = pageRowIds.length > 0 && pageRowIds.every((id) => Boolean(selectedIds[id]));

  const selectedFilteredRows = filteredRows.filter((row) => Boolean(selectedIds[row.id]));
  const exportRows = selectedFilteredRows.length > 0 ? selectedFilteredRows : filteredRows;

  function setPageSafely(next: number) {
    setPage(Math.min(Math.max(next, 1), totalPages));
  }

  function togglePageSelection() {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (allPageSelected) {
        for (const id of pageRowIds) {
          delete next[id];
        }
      } else {
        for (const id of pageRowIds) {
          next[id] = true;
        }
      }
      return next;
    });
  }

  function toggleRowSelection(id: string) {
    setSelectedIds((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    });
  }

  function getExportMatrix() {
    const headers = columns.map((column) => column.label);
    const lines = exportRows.map((row) =>
      columns.map((column) => {
        if (column.exportValue) {
          return toPlainText(column.exportValue(row));
        }
        const fallback = column.render(row);
        if (typeof fallback === "string" || typeof fallback === "number") {
          return toPlainText(fallback);
        }
        return "";
      }),
    );

    return { headers, lines };
  }

  async function exportData(format: ExportFormat) {
    const { headers, lines } = getExportMatrix();
    const stamp = new Date().toISOString().slice(0, 19).replaceAll(":", "-");
    const fileBase = `${exportFileName}-${stamp}`;

    if (format === "json") {
      const payload = lines.map((line) => {
        const row: Record<string, string> = {};
        headers.forEach((header, idx) => {
          row[header] = line[idx] ?? "";
        });
        return row;
      });

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileBase}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === "csv") {
      const csv = [headers, ...lines].map((line) => line.map(csvEscape).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileBase}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (format === "excel") {
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...lines]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      XLSX.writeFile(workbook, `${fileBase}.xlsx`);
      return;
    }

    const windowPrint = window.open("", "_blank", "noopener,noreferrer,width=1000,height=700");
    if (!windowPrint) {
      return;
    }

    const tableHeader = headers.map((header) => `<th>${header}</th>`).join("");
    const tableBody = lines
      .map((line) => `<tr>${line.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
      .join("");

    windowPrint.document.write(`
      <html>
        <head>
          <title>${fileBase}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { margin-bottom: 16px; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <table>
            <thead><tr>${tableHeader}</tr></thead>
            <tbody>${tableBody}</tbody>
          </table>
        </body>
      </html>
    `);
    windowPrint.document.close();
    windowPrint.focus();
    windowPrint.print();
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/68 shadow-[0_18px_35px_-30px_rgba(83,92,173,0.8)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/55">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3 dark:border-slate-800 sm:px-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight sm:text-lg">{title}</h2>
          {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">{actionSlot}</div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/70 px-4 py-3 dark:border-slate-800 sm:px-5">
        <select
          value={pageSize}
          onChange={(event) => {
            const next = Number(event.target.value);
            setPageSize(next);
            setPage(1);
          }}
          className="h-8 rounded-lg border border-input bg-white px-2 text-xs dark:bg-slate-900"
          title="Rows per page"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>

        {filters && filters.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all");
                setPage(1);
              }}
              className={`rounded-lg px-2 py-1 text-xs font-medium ${activeFilter === "all" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
            >
              All
            </button>
            {filters.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setActiveFilter(item.value);
                  setPage(1);
                }}
                className={`rounded-lg px-2 py-1 text-xs font-medium ${activeFilter === item.value ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <label className="relative">
            <Search className="pointer-events-none absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Search"
              className="h-8 w-48 rounded-lg border border-input bg-white pl-7 pr-2 text-xs dark:bg-slate-900"
            />
          </label>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => exportData("csv")}>Export CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData("excel")}>Export Excel</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData("json")}>Export JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportData("pdf")}>Export PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50/75 text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-400">
            <tr>
              <th className="w-10 px-3 py-3">
                <input type="checkbox" title="Select all rows on this page" checked={allPageSelected} onChange={togglePageSelection} />
              </th>
              {columns.map((column) => (
                <th key={column.key} className={`px-3 py-3 font-semibold ${column.headerClassName ?? ""}`}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {emptyMessage ?? "No rows found."}
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-3 align-middle">
                    <input
                      type="checkbox"
                      title={`Select row ${row.id}`}
                      checked={Boolean(selectedIds[row.id])}
                      onChange={() => toggleRowSelection(row.id)}
                    />
                  </td>
                  {columns.map((column) => (
                    <td key={`${row.id}-${column.key}`} className={`px-3 py-3 align-middle ${column.className ?? ""}`}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 px-4 py-3 text-xs text-muted-foreground dark:border-slate-800 sm:px-5">
        <p>
          Showing {filteredRows.length === 0 ? 0 : (safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, filteredRows.length)} of {filteredRows.length} entries
        </p>
        <div className="flex items-center gap-1">
          <Button type="button" size="icon-xs" variant="ghost" onClick={() => setPageSafely(1)} disabled={safePage <= 1}>
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" size="icon-xs" variant="ghost" onClick={() => setPageSafely(safePage - 1)} disabled={safePage <= 1}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-10 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
            {safePage}/{totalPages}
          </span>
          <Button type="button" size="icon-xs" variant="ghost" onClick={() => setPageSafely(safePage + 1)} disabled={safePage >= totalPages}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" size="icon-xs" variant="ghost" onClick={() => setPageSafely(totalPages)} disabled={safePage >= totalPages}>
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export type { TableColumn, TableFilter };

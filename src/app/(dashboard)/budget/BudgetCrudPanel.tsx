"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStatus } from "@/components/providers/StatusProvider";
import { deleteBudgetLimit, setBudgetLimitsBulk } from "@/actions/budget";
import { useRouter } from "next/navigation";

type BudgetLimitRow = {
  id: string;
  category: string;
  maxLimit: number;
  warningThreshold: number;
};

type DraftRow = {
  key: string;
  category: string;
  maxLimit: number;
  warningThreshold: number;
};

export function BudgetCrudPanel({
  limits,
  categorySuggestions,
}: {
  limits: BudgetLimitRow[];
  categorySuggestions: string[];
}) {
  const [existingRows, setExistingRows] = useState<BudgetLimitRow[]>(limits);
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [isPending, startTransition] = useTransition();
  const { showLoading, showSuccess, showError, showConfirm } = useStatus();
  const router = useRouter();

  const usedCategories = useMemo(
    () => new Set([...existingRows.map((l) => l.category), ...draftRows.map((d) => d.category)]),
    [existingRows, draftRows],
  );

  const availableCategories = categorySuggestions.filter((c) => !usedCategories.has(c));

  const addRow = () => {
    const defaultCategory = availableCategories[0] ?? "OTHERS";
    setDraftRows((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        category: defaultCategory,
        maxLimit: 0,
        warningThreshold: 80,
      },
    ]);
  };

  const updateRow = (key: string, patch: Partial<DraftRow>) => {
    setDraftRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  };

  const removeRow = (key: string) => {
    setDraftRows((prev) => prev.filter((row) => row.key !== key));
  };

  const saveAll = () => {
    startTransition(async () => {
      if (!draftRows.length && !existingRows.length) return;
      showLoading("Menyimpan perubahan budget kategori...");
      try {
        await setBudgetLimitsBulk(
          [
            ...existingRows.map((row) => ({
              category: row.category,
              maxLimit: row.maxLimit,
              warningThreshold: row.warningThreshold,
            })),
            ...draftRows.map((row) => ({
              category: row.category,
              maxLimit: row.maxLimit,
              warningThreshold: row.warningThreshold,
            })),
          ],
        );
        showSuccess("Perubahan budget kategori berhasil disimpan.");
        setDraftRows([]);
        router.refresh();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Gagal menyimpan budget.";
        showError(message);
      }
    });
  };

  const handleDelete = (id: string, category: string) => {
    showConfirm({
      title: "Hapus kategori budget?",
      message: `Kategori ${category} akan dihapus dari budget limit.`,
      confirmLabel: "Hapus",
      onConfirm: () => {
        startTransition(async () => {
          showLoading("Menghapus budget kategori...");
          try {
            await deleteBudgetLimit(id);
            showSuccess("Kategori budget berhasil dihapus.");
            router.refresh();
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menghapus kategori.";
            showError(message);
          }
        });
      },
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Budget Categories CRUD</h3>
          <p className="text-sm text-muted-foreground">Edit kategori existing, tambah beberapa kategori baru, lalu simpan dalam satu aksi.</p>
        </div>
        <Button type="button" variant="outline" className="rounded-xl" onClick={addRow}>
          <Plus className="mr-2 h-4 w-4" /> Add Category Row
        </Button>
      </div>

      <div className="space-y-3">
        {existingRows.map((limit) => (
          <div key={limit.id} className="grid grid-cols-1 gap-3 rounded-xl border border-border/60 bg-background/70 p-3 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p>
              <p className="font-semibold">{limit.category}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Max Limit</p>
              <input
                title={`Max limit untuk ${limit.category}`}
                type="number"
                min={1}
                value={limit.maxLimit}
                onChange={(e) =>
                  setExistingRows((prev) =>
                    prev.map((row) =>
                      row.id === limit.id ? { ...row, maxLimit: Number(e.target.value) } : row,
                    ),
                  )
                }
                className="w-full rounded-xl border border-input bg-white/70 px-3 py-2 dark:bg-slate-900/35"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Warning Threshold</p>
              <input
                title={`Warning threshold untuk ${limit.category}`}
                type="number"
                min={1}
                max={100}
                value={limit.warningThreshold}
                onChange={(e) =>
                  setExistingRows((prev) =>
                    prev.map((row) =>
                      row.id === limit.id ? { ...row, warningThreshold: Number(e.target.value) } : row,
                    ),
                  )
                }
                className="w-full rounded-xl border border-input bg-white/70 px-3 py-2 dark:bg-slate-900/35"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-rose-600 hover:text-rose-700"
              onClick={() => handleDelete(limit.id, limit.category)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        ))}
      </div>

      {draftRows.length ? (
        <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-background/50 p-3">
          <p className="text-sm font-medium">New / Update Rows</p>
          {draftRows.map((row) => (
            <div key={row.key} className="grid grid-cols-1 gap-3 rounded-xl border border-border/60 bg-card/60 p-3 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p>
                <input type="hidden" name={`category-${row.key}`} value={row.category} />
                <Select value={row.category} onValueChange={(value) => updateRow(row.key, { category: value })}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorySuggestions.map((category) => (
                      <SelectItem key={`${row.key}-${category}`} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Max Limit</p>
                <input
                  title={`Max limit draft kategori ${row.category}`}
                  type="number"
                  min={1}
                  value={row.maxLimit}
                  onChange={(e) => updateRow(row.key, { maxLimit: Number(e.target.value) })}
                  className="w-full rounded-xl border border-input bg-white/70 px-3 py-2 dark:bg-slate-900/35"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Warning %</p>
                <input
                  title={`Warning threshold draft kategori ${row.category}`}
                  type="number"
                  min={1}
                  max={100}
                  value={row.warningThreshold}
                  onChange={(e) => updateRow(row.key, { warningThreshold: Number(e.target.value) })}
                  className="w-full rounded-xl border border-input bg-white/70 px-3 py-2 dark:bg-slate-900/35"
                />
              </div>

              <Button type="button" variant="ghost" size="sm" onClick={() => removeRow(row.key)}>
                Remove
              </Button>
            </div>
          ))}

          <div className="flex justify-end">
            <Button type="button" disabled={isPending} onClick={saveAll} className="rounded-xl">
              {isPending ? "Saving..." : "Save All Rows"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button type="button" disabled={isPending} onClick={saveAll} className="rounded-xl">
            {isPending ? "Saving..." : "Save Existing Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}

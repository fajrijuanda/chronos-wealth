"use client";

import { useMemo, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStatus } from "@/components/providers/StatusProvider";
import {
  createJointBoothProposalByEmail,
  createNonBoothAssetByEmail,
} from "@/actions/collaboration";
import { AssetType, BoothPackageType, BoothSelectionType } from "@prisma/client";
import { useRouter } from "next/navigation";

export function AddAssetButton({ email, basePrice }: { email: string, basePrice: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [assetTypeValue, setAssetTypeValue] = useState<"BOOTH" | AssetType>("BOOTH");
  const [packageTypeValue, setPackageTypeValue] = useState<"ECONOMY" | "EXCLUSIVE">("ECONOMY");
  const [mouDateValue, setMouDateValue] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const { showLoading, showSuccess, showError } = useStatus();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isBoothAsset = assetTypeValue === "BOOTH";

  const nonBoothNameLabel = useMemo(() => {
    if (assetTypeValue === "GOLD") return "Nama Emas";
    if (assetTypeValue === "PROPERTY") return "Nama Properti";
    return "Nama Asset";
  }, [assetTypeValue]);

  const nonBoothNamePlaceholder = useMemo(() => {
    if (assetTypeValue === "GOLD") return "Emas Batangan Antam";
    if (assetTypeValue === "PROPERTY") return "Rumah Bandung Timur";
    return "Mobil, tanah, koleksi, dll.";
  }, [assetTypeValue]);

  const payoutDatePreview = useMemo(() => {
    const parsed = new Date(`${mouDateValue}T00:00:00`);
    const mouDay = Number.isNaN(parsed.getTime()) ? 1 : parsed.getDate();
    if (packageTypeValue === "EXCLUSIVE") {
      return mouDay;
    }

    const nextDay = mouDay + 1;
    return nextDay > 31 ? 1 : nextDay;
  }, [mouDateValue, packageTypeValue]);

  function arrayBufferToBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = "";

    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }

    return btoa(binary);
  }

  async function handleSubmit(formData: FormData) {
    const assetTypeRaw = String(formData.get("assetType") ?? "BOOTH").toUpperCase();
    const selectedAssetType: "BOOTH" | AssetType =
      assetTypeRaw === "GOLD" || assetTypeRaw === "PROPERTY" || assetTypeRaw === "OTHER"
        ? (assetTypeRaw as AssetType)
        : "BOOTH";
    const name = String(formData.get("name") ?? "");
    const price = Number(formData.get("price") ?? 0);
    const income = Number(formData.get("income") ?? 0);
    const packageType = formData.get("packageType") === "EXCLUSIVE" ? BoothPackageType.EXCLUSIVE : BoothPackageType.ECONOMY;
    const mouSignedAtRaw = String(formData.get("mouSignedAt") ?? "").trim();
    const mouSignedAt = mouSignedAtRaw ? new Date(`${mouSignedAtRaw}T00:00:00`) : new Date();
    const mouFile = formData.get("mouFile");

    let mouDocumentName: string | undefined;
    let mouDocumentMimeType: string | undefined;
    let mouDocumentBase64: string | undefined;

    if (selectedAssetType === "BOOTH" && mouFile instanceof File && mouFile.size > 0) {
      if (mouFile.type !== "application/pdf") {
        showError("File MoU harus berformat PDF.");
        return;
      }

      if (mouFile.size > 5 * 1024 * 1024) {
        showError("Ukuran PDF MoU maksimal 5 MB.");
        return;
      }

      mouDocumentName = mouFile.name;
      mouDocumentMimeType = mouFile.type;
      mouDocumentBase64 = arrayBufferToBase64(await mouFile.arrayBuffer());
    }

    const estimatedValue = Number(formData.get("estimatedValue") ?? 0);
    const quantityRaw = String(formData.get("quantity") ?? "").trim();
    const quantity = quantityRaw ? Number(quantityRaw) : null;
    const notes = String(formData.get("notes") ?? "").trim();
    const acquiredAtRaw = String(formData.get("acquiredAt") ?? "").trim();
    const acquiredAt = acquiredAtRaw ? new Date(`${acquiredAtRaw}T00:00:00`) : null;

    startTransition(async () => {
        showLoading("Menambahkan asset ke portofolio...");
        try {
            if (selectedAssetType === "BOOTH") {
              await createJointBoothProposalByEmail({
                  requesterEmail: email,
                  partnerEmail: email,
                  boothName: name,
                  boothPrice: price,
                  requesterAvailableBalance: price,
                  partnerBoothPrice: 0,
                  expectedMonthlyIncome: income,
                  packageType,
                  mouSignedAt,
                  mouDocumentName,
                  mouDocumentMimeType,
                  mouDocumentBase64,
                  selectedBoothType: BoothSelectionType.NEW_BOOTH,
              });
            } else {
              await createNonBoothAssetByEmail({
                ownerEmail: email,
                type: selectedAssetType,
                name,
                estimatedValue,
                quantity,
                unit: selectedAssetType === "GOLD" ? "gram" : null,
                notes: notes || null,
                acquiredAt,
              });
            }

            showSuccess("Asset baru berhasil ditambahkan ke portofolio.");
            setIsOpen(false);
            router.refresh();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Gagal menambahkan asset.";
            showError(message);
        }
    });
  }

  return (
    <>
      <Button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 h-auto"
      >
        <Plus className="w-4 h-4" />
        Add Asset
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Tambahkan booth baru ke dalam portofolio asetmu secara manual.
            </DialogDescription>
          </DialogHeader>
          <form action={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="asset-type" className="text-sm font-medium">Jenis Asset</label>
              <input type="hidden" name="assetType" value={assetTypeValue} />
              <Select
                value={assetTypeValue}
                onValueChange={(value) => {
                  const next = value.toUpperCase();
                  if (next === "GOLD" || next === "PROPERTY" || next === "OTHER") {
                    setAssetTypeValue(next);
                    return;
                  }
                  setAssetTypeValue("BOOTH");
                }}
              >
                <SelectTrigger id="asset-type" className="w-full">
                  <SelectValue placeholder="Pilih jenis asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOOTH">Booth</SelectItem>
                  <SelectItem value="GOLD">Emas</SelectItem>
                  <SelectItem value="PROPERTY">Rumah / Properti</SelectItem>
                  <SelectItem value="OTHER">Asset Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="asset-name" className="text-sm font-medium">
                {isBoothAsset ? "Nama Booth" : nonBoothNameLabel}
              </label>
              <input
                id="asset-name"
                name="name"
                required
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                placeholder={isBoothAsset ? "Booth Ekonomi 01" : nonBoothNamePlaceholder}
              />
            </div>

            {isBoothAsset ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="asset-price" className="text-sm font-medium">Harga Beli (Rp)</label>
                    <input
                      id="asset-price"
                      name="price"
                      type="number"
                      required
                      defaultValue={basePrice}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="asset-income" className="text-sm font-medium">Income Bulanan (Rp)</label>
                    <input
                      id="asset-income"
                      name="income"
                      type="number"
                      required
                      defaultValue={1000000}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="asset-package-type" className="text-sm font-medium">Tipe Paket</label>
                  <input type="hidden" name="packageType" value={packageTypeValue} />
                  <Select
                    value={packageTypeValue}
                    onValueChange={(value) => setPackageTypeValue(value === "EXCLUSIVE" ? "EXCLUSIVE" : "ECONOMY")}
                  >
                    <SelectTrigger id="asset-package-type" className="w-full">
                      <SelectValue placeholder="Pilih paket" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECONOMY">Ekonomi</SelectItem>
                      <SelectItem value="EXCLUSIVE">Eksklusif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="asset-mou-signed-at" className="text-sm font-medium">Tanggal TTD MoU</label>
                    <input
                      id="asset-mou-signed-at"
                      name="mouSignedAt"
                      type="date"
                      required
                      value={mouDateValue}
                      onChange={(event) => setMouDateValue(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      Jadwal cair otomatis: <span className="font-semibold">tanggal {payoutDatePreview}</span> setiap bulan.
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Paket Ekonomi = H+1 dari TTD MoU, Paket Eksklusif = tanggal yang sama dengan TTD MoU.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="asset-mou-file" className="text-sm font-medium">Upload PDF MoU (Opsional)</label>
                    <input
                      id="asset-mou-file"
                      name="mouFile"
                      type="file"
                      accept="application/pdf,.pdf"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium dark:file:bg-slate-800"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400">Maksimal 5 MB.</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="asset-estimated-value" className="text-sm font-medium">Estimasi Nilai Saat Ini (Rp)</label>
                    <input
                      id="asset-estimated-value"
                      name="estimatedValue"
                      type="number"
                      min={0}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                      placeholder="250000000"
                    />
                  </div>
                  {assetTypeValue === "GOLD" ? (
                    <div className="space-y-2">
                      <label htmlFor="asset-quantity" className="text-sm font-medium">Berat (gram)</label>
                      <input
                        id="asset-quantity"
                        name="quantity"
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                        placeholder="100"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <label htmlFor="asset-acquired-at" className="text-sm font-medium">Tanggal Perolehan (Opsional)</label>
                  <input
                    id="asset-acquired-at"
                    name="acquiredAt"
                    type="date"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="asset-notes" className="text-sm font-medium">Catatan (Opsional)</label>
                  <textarea
                    id="asset-notes"
                    name="notes"
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2"
                    placeholder="Contoh: bukan aset penghasil income rutin"
                  />
                </div>
              </>
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isPending ? "Saving..." : "Save Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

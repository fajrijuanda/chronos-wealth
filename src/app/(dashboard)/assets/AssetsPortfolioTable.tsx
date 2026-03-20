"use client";

import { BoothPackageType } from "@prisma/client";
import { Gem, House, Layers, Crown, ShoppingCart, Star } from "lucide-react";
import { formatGroupedNumber } from "@/lib/number-format";
import { formatJakartaDate } from "@/lib/date-format";
import { ManagementTable, type TableColumn, type TableFilter } from "@/components/ui/management-table";
import { AssetTableRowActions } from "./AssetTableRowActions";

type AssetRow = {
  id: string;
  assetType: "BOOTH" | "GOLD" | "PROPERTY" | "OTHER";
  name: string;
  packageLabel: string;
  value: number;
  detail: string;
  status: "ACTIVE" | "OWNED";
  notes?: string;
  acquiredAt?: Date | null;
  boothAction?: {
    ownershipId: string;
    boothId: string;
    boothName: string;
    expectedMonthlyIncome: number;
    capitalAmount: number;
    revenueSharePct: number;
  };
};

function getTypeMeta(type: AssetRow["assetType"]) {
  if (type === "GOLD") {
    return {
      label: "Gold",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/35 dark:text-amber-300",
      Icon: Gem,
    };
  }
  if (type === "PROPERTY") {
    return {
      label: "Property",
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300",
      Icon: House,
    };
  }
  if (type === "OTHER") {
    return {
      label: "Other",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      Icon: Layers,
    };
  }
  return {
    label: "Booth",
    className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/35 dark:text-indigo-300",
    Icon: Layers,
  };
}

function getBoothPlanMeta(packageType: string) {
  if (packageType === "EXCLUSIVE") {
    return {
      label: "Exclusive",
      className: "bg-purple-100 text-purple-700 dark:bg-purple-900/35 dark:text-purple-300",
      Icon: Crown,
    };
  }
  if (packageType === "ECONOMY") {
    return {
      label: "Economy",
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/35 dark:text-blue-300",
      Icon: ShoppingCart,
    };
  }
  return {
    label: packageType || "Standard",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    Icon: Star,
  };
}

export function AssetsPortfolioTable({
  portfolio,
  nonBoothAssets,
}: {
  portfolio: Array<{
    ownershipId: string;
    boothId: string;
    boothName: string;
    packageType: BoothPackageType;
    expectedMonthlyIncome: number;
    revenueSharePct: number;
    capitalAmount: number;
    isShared: boolean;
  }>;
  nonBoothAssets: Array<{
    id: string;
    type: "GOLD" | "PROPERTY" | "OTHER";
    name: string;
    estimatedValue: number;
    quantity: number | null;
    unit: string | null;
    notes: string | null;
    acquiredAt: Date | null;
  }>;
}) {
  const rows = mapAssetRows({ portfolio, nonBoothAssets });

  const columns: Array<TableColumn<AssetRow>> = [
    {
      key: "name",
      label: "Asset",
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{row.name}</p>
          {row.notes ? <p className="max-w-72 truncate text-xs text-muted-foreground">{row.notes}</p> : null}
        </div>
      ),
      exportValue: (row) => row.name,
      sortValue: (row) => row.name,
    },
    {
      key: "category",
      label: "Category",
      render: (row) => {
        const meta = getTypeMeta(row.assetType);
        const Icon = meta.Icon;
        return (
          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold ${meta.className}`}>
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
        );
      },
      exportValue: (row) => getTypeMeta(row.assetType).label,
      sortValue: (row) => getTypeMeta(row.assetType).label,
    },
    {
      key: "package",
      label: "Plan",
      render: (row) => {
        if (row.assetType !== "BOOTH") {
          return row.packageLabel;
        }
        const meta = getBoothPlanMeta(row.packageLabel);
        const Icon = meta.Icon;
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}>
            <Icon className="h-3.5 w-3.5" />
            {meta.label}
          </span>
        );
      },
      exportValue: (row) => row.assetType === "BOOTH" ? getBoothPlanMeta(row.packageLabel).label : row.packageLabel,
      sortValue: (row) => row.packageLabel,
    },
    {
      key: "value",
      label: "Value",
      render: (row) => <span className="font-semibold">Rp {formatGroupedNumber(row.value)}</span>,
      exportValue: (row) => row.value,
      sortValue: (row) => row.value,
    },
    {
      key: "detail",
      label: "Detail",
      render: (row) => (
        <div>
          <p>{row.detail}</p>
          <p className="text-xs text-muted-foreground">{row.acquiredAt ? formatJakartaDate(row.acquiredAt) : "-"}</p>
        </div>
      ),
      exportValue: (row) => `${row.detail} ${row.acquiredAt ? `(${formatJakartaDate(row.acquiredAt)})` : ""}`,
      sortValue: (row) => row.acquiredAt || "",
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-semibold ${row.status === "ACTIVE" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-300" : "bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-300"}`}>
          {row.status}
        </span>
      ),
      exportValue: (row) => row.status,
      sortValue: (row) => row.status,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      headerClassName: "text-right",
      render: (row) =>
        row.boothAction ? (
          <div className="flex justify-end">
            <AssetTableRowActions
              ownershipId={row.boothAction.ownershipId}
              boothId={row.boothAction.boothId}
              boothName={row.boothAction.boothName}
              expectedMonthlyIncome={row.boothAction.expectedMonthlyIncome}
              capitalAmount={row.boothAction.capitalAmount}
              revenueSharePct={row.boothAction.revenueSharePct}
            />
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
      exportValue: () => "",
      disableSort: true,
    },
  ];

  const filters: Array<TableFilter<AssetRow>> = [
    { value: "booth", label: "Booth", predicate: (row) => row.assetType === "BOOTH" },
    { value: "gold", label: "Gold", predicate: (row) => row.assetType === "GOLD" },
    { value: "property", label: "Property", predicate: (row) => row.assetType === "PROPERTY" },
    { value: "other", label: "Other", predicate: (row) => row.assetType === "OTHER" },
  ];

  return (
    <ManagementTable
      title="Portfolio Assets"
      subtitle="Satu tabel lintas kategori. Filter, pilih baris, lalu export sesuai hasil filter/seleksi."
      rows={rows}
      columns={columns}
      filters={filters}
      searchableText={(row) => `${row.name} ${row.assetType} ${row.packageLabel} ${row.detail} ${row.notes ?? ""}`}
      emptyMessage="Belum ada data asset."
      exportFileName="assets-portfolio"
      defaultPageSize={10}
    />
  );
}

function mapAssetRows(input: {
  portfolio: Array<{
    ownershipId: string;
    boothId: string;
    boothName: string;
    packageType: BoothPackageType;
    expectedMonthlyIncome: number;
    revenueSharePct: number;
    capitalAmount: number;
    isShared: boolean;
  }>;
  nonBoothAssets: Array<{
    id: string;
    type: "GOLD" | "PROPERTY" | "OTHER";
    name: string;
    estimatedValue: number;
    quantity: number | null;
    unit: string | null;
    notes: string | null;
    acquiredAt: Date | null;
  }>;
}) {
  const boothRows: AssetRow[] = input.portfolio.map((item) => ({
    id: item.ownershipId,
    assetType: "BOOTH",
    name: item.boothName,
    packageLabel: item.packageType,
    value: item.capitalAmount,
    detail: `Income Rp ${formatGroupedNumber(item.expectedMonthlyIncome)} | Share ${item.revenueSharePct.toFixed(1)}%`,
    status: item.isShared ? "ACTIVE" : "OWNED",
    boothAction: {
      ownershipId: item.ownershipId,
      boothId: item.boothId,
      boothName: item.boothName,
      expectedMonthlyIncome: item.expectedMonthlyIncome,
      capitalAmount: item.capitalAmount,
      revenueSharePct: item.revenueSharePct,
    },
  }));

  const nonBoothRows: AssetRow[] = input.nonBoothAssets.map((item) => ({
    id: item.id,
    assetType: item.type,
    name: item.name,
    packageLabel: "Manual",
    value: item.estimatedValue,
    detail: item.quantity !== null && item.quantity !== undefined
      ? `${item.quantity} ${item.unit ?? "unit"}`
      : "-",
    status: "ACTIVE",
    notes: item.notes ?? undefined,
    acquiredAt: item.acquiredAt,
  }));

  return [...boothRows, ...nonBoothRows];
}

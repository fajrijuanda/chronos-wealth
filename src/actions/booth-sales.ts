"use server";

import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ensureAppUserByEmail } from "@/actions/collaboration";
import { getSessionUserEmail } from "@/lib/auth-session";
import { isSuperAdminEmail } from "@/lib/active-user";

type MonthlyBoothSalesRow = {
  boothName: string;
  grossIncome: number;
  netIncome?: number;
};

type ParsedSalesSheet = {
  rows: MonthlyBoothSalesRow[];
  warnings: string[];
};

function normalizeCellKey(key: string) {
  return key.trim().toLowerCase().replace(/\s+/g, "");
}

function pickNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[.,](?=\d{3}\b)/g, "").replace(/,/g, ".");
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function readRowValue(
  row: Record<string, unknown>,
  aliases: string[],
): unknown {
  const aliasSet = new Set(aliases.map(normalizeCellKey));
  for (const [rawKey, value] of Object.entries(row)) {
    if (aliasSet.has(normalizeCellKey(rawKey))) {
      return value;
    }
  }
  return undefined;
}

export async function parseBoothSalesExcel(file: File): Promise<ParsedSalesSheet> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });

  if (workbook.SheetNames.length === 0) {
    throw new Error("The uploaded Excel file is empty");
  }

  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: null,
  });

  const warnings: string[] = [];
  const rows: MonthlyBoothSalesRow[] = [];

  jsonRows.forEach((row: Record<string, unknown>, index: number) => {
    const boothNameValue = readRowValue(row, [
      "booth",
      "boothname",
      "nama booth",
      "nama_booth",
      "booth_name",
    ]);

    const grossValue = readRowValue(row, [
      "grossincome",
      "gross",
      "sales",
      "hasilpenjualan",
      "penjualan",
      "omzet",
    ]);

    const netValue = readRowValue(row, [
      "netincome",
      "net",
      "profit",
      "bersih",
      "hasilbersih",
    ]);

    const boothName = typeof boothNameValue === "string" ? boothNameValue.trim() : "";
    const grossIncome = pickNumber(grossValue);
    const netIncome = pickNumber(netValue);

    if (!boothName) {
      warnings.push(`Row ${index + 2}: booth name is missing`);
      return;
    }

    if (grossIncome === null || grossIncome < 0) {
      warnings.push(`Row ${index + 2}: gross income is invalid`);
      return;
    }

    rows.push({
      boothName,
      grossIncome,
      netIncome: netIncome !== null && netIncome >= 0 ? netIncome : undefined,
    });
  });

  if (rows.length === 0) {
    throw new Error("No valid sales rows found in the Excel file");
  }

  return { rows, warnings };
}

export async function importMonthlyBoothSales(input: {
  uploadedById: string;
  month: number;
  year: number;
  file: File;
}) {
  if (input.month < 1 || input.month > 12) {
    throw new Error("month must be between 1 and 12");
  }

  if (input.year < 2000 || input.year > 2500) {
    throw new Error("year is out of allowed range");
  }

  const parsed = await parseBoothSalesExcel(input.file);

  const ownerships = await prisma.boothOwnership.findMany({
    where: { userId: input.uploadedById },
    include: { booth: true },
  });

  const boothByName = new Map<string, (typeof ownerships)[number]["booth"]>(
    ownerships.map((ownership) => [ownership.booth.name.toLowerCase(), ownership.booth]),
  );

  let imported = 0;
  const notFound: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (const row of parsed.rows) {
      const booth = boothByName.get(row.boothName.toLowerCase());
      if (!booth) {
        notFound.push(row.boothName);
        continue;
      }

      await tx.boothMonthlySale.upsert({
        where: {
          boothId_month_year: {
            boothId: booth.id,
            month: input.month,
            year: input.year,
          },
        },
        update: {
          grossIncome: row.grossIncome,
          netIncome: row.netIncome,
          uploadedById: input.uploadedById,
          uploadedAt: new Date(),
        },
        create: {
          boothId: booth.id,
          month: input.month,
          year: input.year,
          grossIncome: row.grossIncome,
          netIncome: row.netIncome,
          uploadedById: input.uploadedById,
        },
      });

      imported++;
    }
  });

  revalidatePath("/income");
  revalidatePath("/targets");

  return {
    imported,
    notFound,
    warnings: parsed.warnings,
    month: input.month,
    year: input.year,
  };
}

export async function importMonthlyBoothSalesByEmail(input: {
  uploadedByEmail: string;
  month: number;
  year: number;
  file: File;
}) {
  const sessionEmail = await getSessionUserEmail();
  if (!sessionEmail) {
    throw new Error("Unauthorized");
  }

  const normalizedTargetEmail = input.uploadedByEmail.trim().toLowerCase();
  const canUploadForAnyUser = isSuperAdminEmail(sessionEmail);
  if (!canUploadForAnyUser && normalizedTargetEmail !== sessionEmail) {
    throw new Error("Unauthorized");
  }

  const user = await ensureAppUserByEmail({ email: input.uploadedByEmail });
  return importMonthlyBoothSales({
    uploadedById: user.id,
    month: input.month,
    year: input.year,
    file: input.file,
  });
}

export async function getBoothSalesHistoryByUserId(input: {
  userId: string;
  limit?: number;
}) {
  const limit = input.limit ?? 24;

  return prisma.boothMonthlySale.findMany({
    where: {
      booth: {
        ownerships: {
          some: { userId: input.userId },
        },
      },
    },
    include: {
      booth: true,
      uploadedBy: true,
    },
    orderBy: [{ year: "desc" }, { month: "desc" }, { uploadedAt: "desc" }],
    take: limit,
  });
}

export async function getBoothSalesHistoryByEmail(input: {
  email: string;
  limit?: number;
}) {
  const user = await ensureAppUserByEmail({ email: input.email });
  return getBoothSalesHistoryByUserId({ userId: user.id, limit: input.limit });
}

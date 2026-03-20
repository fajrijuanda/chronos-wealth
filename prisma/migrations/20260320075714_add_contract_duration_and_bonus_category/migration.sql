-- AlterEnum
ALTER TYPE "CategoryType" ADD VALUE 'BONUS';

-- AlterTable
ALTER TABLE "IncomeSource" ADD COLUMN     "contractDurationMonths" INTEGER DEFAULT 12;

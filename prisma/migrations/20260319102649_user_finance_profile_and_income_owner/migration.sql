-- CreateEnum
CREATE TYPE "BoothPurchaseTiming" AS ENUM ('START_OF_MONTH', 'END_OF_MONTH');

-- AlterTable
ALTER TABLE "IncomeSource" ADD COLUMN     "ownerUserId" TEXT;

-- CreateTable
CREATE TABLE "UserFinanceProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthlyExpenseMin" DOUBLE PRECISION NOT NULL DEFAULT 1000000,
    "monthlyExpenseMax" DOUBLE PRECISION NOT NULL DEFAULT 1000000,
    "purchaseTiming" "BoothPurchaseTiming" NOT NULL DEFAULT 'START_OF_MONTH',
    "purchaseDayOverride" INTEGER,
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFinanceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserFinanceProfile_userId_key" ON "UserFinanceProfile"("userId");

-- AddForeignKey
ALTER TABLE "IncomeSource" ADD CONSTRAINT "IncomeSource_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFinanceProfile" ADD CONSTRAINT "UserFinanceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

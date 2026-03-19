-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('BOOTH', 'SAAS', 'SALARY', 'PROJECT', 'COMMISSION', 'STOCK');

-- CreateEnum
CREATE TYPE "TxType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BoothSelectionType" AS ENUM ('NEW_BOOTH', 'EXISTING_BOOTH');

-- CreateEnum
CREATE TYPE "BoothPurchaseTiming" AS ENUM ('START_OF_MONTH', 'END_OF_MONTH');

-- CreateEnum
CREATE TYPE "BoothPackageType" AS ENUM ('EXCLUSIVE', 'ECONOMY');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('GOLD', 'PROPERTY', 'OTHER');

-- CreateEnum
CREATE TYPE "GrowthTargetKind" AS ENUM ('ACCOUNT_COUNT', 'CAPITAL_POOL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'FINANCE', 'COLLABORATION', 'SOCIAL');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "IncomeSource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "CategoryType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "payoutDate" INTEGER,
    "expectedDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "ownerUserId" TEXT,

    CONSTRAINT "IncomeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "profilePhotoUrl" TEXT,
    "bio" TEXT,
    "boothBasePrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAsset" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "name" TEXT NOT NULL,
    "estimatedValue" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "notes" TEXT,
    "acquiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAsset_pkey" PRIMARY KEY ("id")
);

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
    "idleCashTarget" DOUBLE PRECISION NOT NULL DEFAULT 1000000000,
    "renewEconomyBoothContracts" BOOLEAN NOT NULL DEFAULT true,
    "renewExclusiveBoothContracts" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserFinanceProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGrowthTarget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "GrowthTargetKind" NOT NULL,
    "title" TEXT NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "note" TEXT,
    "deadline" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGrowthTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JointBoothProposal" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "boothName" TEXT NOT NULL,
    "requesterCapital" DOUBLE PRECISION NOT NULL,
    "partnerCapital" DOUBLE PRECISION NOT NULL,
    "expectedMonthlyIncome" DOUBLE PRECISION NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'PENDING',
    "selectedBoothType" "BoothSelectionType" NOT NULL,
    "notes" TEXT,
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewerNote" TEXT,
    "createdBoothId" TEXT,
    "mouSignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "packageType" "BoothPackageType" NOT NULL DEFAULT 'ECONOMY',
    "referralEconomyBooths" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "JointBoothProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booth" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expectedMonthlyIncome" DOUBLE PRECISION NOT NULL,
    "mouDocumentName" TEXT,
    "mouDocumentMimeType" TEXT,
    "mouDocumentData" BYTEA,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mouSignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "packageType" "BoothPackageType" NOT NULL DEFAULT 'ECONOMY',
    "referralCommissionPerBooth" DOUBLE PRECISION NOT NULL DEFAULT 250000,
    "referralEconomyBooths" INTEGER NOT NULL DEFAULT 0,
    "boothUnitCount" INTEGER NOT NULL DEFAULT 1,
    "contractDurationMonths" INTEGER NOT NULL DEFAULT 24,
    "economyProfitSharePct" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "exclusivePhase2StartsAfterMonths" INTEGER NOT NULL DEFAULT 96,
    "exclusiveRenewalCapital" DOUBLE PRECISION NOT NULL DEFAULT 20000000,
    "exclusiveSharePhase1Pct" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "exclusiveSharePhase2Pct" DOUBLE PRECISION NOT NULL DEFAULT 60,

    CONSTRAINT "Booth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoothOwnership" (
    "id" TEXT NOT NULL,
    "boothId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "capitalAmount" DOUBLE PRECISION NOT NULL,
    "revenueSharePct" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoothOwnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoothMonthlySale" (
    "id" TEXT NOT NULL,
    "boothId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "grossIncome" DOUBLE PRECISION NOT NULL,
    "netIncome" DOUBLE PRECISION,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoothMonthlySale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBoothTarget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetBoothEquivalent" INTEGER NOT NULL,
    "revenuePerBooth" DOUBLE PRECISION NOT NULL DEFAULT 1000000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBoothTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "type" "TxType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "sourceId" TEXT,
    "expenseCategory" TEXT,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLimit" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "maxLimit" DOUBLE PRECISION NOT NULL,
    "warningThreshold" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BudgetLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingGoal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DOUBLE PRECISION NOT NULL,
    "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3) NOT NULL,
    "priority" INTEGER NOT NULL,

    CONSTRAINT "SavingGoal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppUser_email_key" ON "AppUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserFinanceProfile_userId_key" ON "UserFinanceProfile"("userId");

-- CreateIndex
CREATE INDEX "UserGrowthTarget_userId_kind_idx" ON "UserGrowthTarget"("userId", "kind");

-- CreateIndex
CREATE INDEX "UserNotification_userId_createdAt_idx" ON "UserNotification"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_requesterId_addresseeId_key" ON "Friendship"("requesterId", "addresseeId");

-- CreateIndex
CREATE UNIQUE INDEX "JointBoothProposal_createdBoothId_key" ON "JointBoothProposal"("createdBoothId");

-- CreateIndex
CREATE UNIQUE INDEX "Booth_name_key" ON "Booth"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BoothOwnership_boothId_userId_key" ON "BoothOwnership"("boothId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "BoothMonthlySale_boothId_month_year_key" ON "BoothMonthlySale"("boothId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "UserBoothTarget_userId_key" ON "UserBoothTarget"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetLimit_category_key" ON "BudgetLimit"("category");

-- AddForeignKey
ALTER TABLE "IncomeSource" ADD CONSTRAINT "IncomeSource_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAsset" ADD CONSTRAINT "UserAsset_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFinanceProfile" ADD CONSTRAINT "UserFinanceProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGrowthTarget" ADD CONSTRAINT "UserGrowthTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotification" ADD CONSTRAINT "UserNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JointBoothProposal" ADD CONSTRAINT "JointBoothProposal_createdBoothId_fkey" FOREIGN KEY ("createdBoothId") REFERENCES "Booth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JointBoothProposal" ADD CONSTRAINT "JointBoothProposal_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JointBoothProposal" ADD CONSTRAINT "JointBoothProposal_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoothOwnership" ADD CONSTRAINT "BoothOwnership_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoothOwnership" ADD CONSTRAINT "BoothOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoothMonthlySale" ADD CONSTRAINT "BoothMonthlySale_boothId_fkey" FOREIGN KEY ("boothId") REFERENCES "Booth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoothMonthlySale" ADD CONSTRAINT "BoothMonthlySale_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBoothTarget" ADD CONSTRAINT "UserBoothTarget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "IncomeSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('GOLD', 'PROPERTY', 'OTHER');

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

-- AddForeignKey
ALTER TABLE "UserAsset" ADD CONSTRAINT "UserAsset_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

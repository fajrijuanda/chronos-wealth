-- AlterTable
ALTER TABLE "Booth"
ADD COLUMN "mouDocumentName" TEXT,
ADD COLUMN "mouDocumentMimeType" TEXT,
ADD COLUMN "mouDocumentData" BYTEA;

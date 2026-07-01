-- RenameTable
ALTER TABLE "CustomPortfolio" RENAME TO "CustomAsset";

-- RenameIndex
ALTER INDEX "CustomPortfolio_userId_idx" RENAME TO "CustomAsset_userId_idx";

-- RenameForeignKey
ALTER TABLE "CustomAsset" RENAME CONSTRAINT "CustomPortfolio_userId_fkey" TO "CustomAsset_userId_fkey";

-- RenamePrimaryKey
ALTER TABLE "CustomAsset" RENAME CONSTRAINT "CustomPortfolio_pkey" TO "CustomAsset_pkey";

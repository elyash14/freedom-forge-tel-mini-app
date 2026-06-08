-- AlterTable
ALTER TABLE "AppConfig" ADD COLUMN "defaultUsdTomanGrowthRate" DOUBLE PRECISION NOT NULL DEFAULT 0.45;

-- AlterTable
ALTER TABLE "FreedomPlan" ADD COLUMN "usdTomanGrowthRate" DOUBLE PRECISION;

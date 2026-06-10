-- DropForeignKey
ALTER TABLE "FreedomPlan" DROP CONSTRAINT IF EXISTS "FreedomPlan_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "FreedomPlan";

-- DropTable
ALTER TABLE "AppConfig" DROP COLUMN IF EXISTS "defaultInflationRate";

-- AlterTable: remove static return from asset classes
ALTER TABLE "AssetClass" DROP COLUMN IF EXISTS "historicalNominalReturn";

-- CreateTable
CREATE TABLE "historical_returns" (
    "year" INTEGER NOT NULL,
    "inflation" DOUBLE PRECISION NOT NULL,
    "stock_market" DOUBLE PRECISION NOT NULL,
    "gold" DOUBLE PRECISION NOT NULL,
    "bank_deposit" DOUBLE PRECISION NOT NULL,
    "investment_fund" DOUBLE PRECISION NOT NULL,
    "crypto" DOUBLE PRECISION,

    CONSTRAINT "historical_returns_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "FreedomPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fa',
    "monthlyExpense" DOUBLE PRECISION NOT NULL,
    "initialCapital" DOUBLE PRECISION NOT NULL,
    "portfolioAllocation" JSONB NOT NULL,
    "nominalReturnRate" DOUBLE PRECISION NOT NULL,
    "realReturnRate" DOUBLE PRECISION NOT NULL,
    "monthlyContribution" DOUBLE PRECISION NOT NULL,
    "targetCapital" DOUBLE PRECISION NOT NULL,
    "yearsToFreedom" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreedomPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FreedomPlan_sessionId_idx" ON "FreedomPlan"("sessionId");

-- CreateIndex
CREATE INDEX "FreedomPlan_userId_idx" ON "FreedomPlan"("userId");

-- AddForeignKey
ALTER TABLE "FreedomPlan" ADD CONSTRAINT "FreedomPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "FreedomPlan" DROP CONSTRAINT IF EXISTS "FreedomPlan_userId_fkey";

-- DropTable
DROP TABLE IF EXISTS "FreedomPlan";
DROP TABLE IF EXISTS "ExpenseCategory";
DROP TABLE IF EXISTS "AppConfig";

-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL,
    "defaultInflationRate" DOUBLE PRECISION NOT NULL DEFAULT 0.45,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetClass" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelFa" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "historicalNominalReturn" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetClass_pkey" PRIMARY KEY ("id")
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
    "inflationRate" DOUBLE PRECISION NOT NULL,
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
CREATE UNIQUE INDEX "AssetClass_key_key" ON "AssetClass"("key");

-- CreateIndex
CREATE INDEX "FreedomPlan_sessionId_idx" ON "FreedomPlan"("sessionId");

-- CreateIndex
CREATE INDEX "FreedomPlan_userId_idx" ON "FreedomPlan"("userId");

-- AddForeignKey
ALTER TABLE "FreedomPlan" ADD CONSTRAINT "FreedomPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropTable (AppConfig columns replaced)
ALTER TABLE "AppConfig" DROP COLUMN IF EXISTS "defaultWithdrawalRate";
ALTER TABLE "AppConfig" DROP COLUMN IF EXISTS "defaultSavingsPercent";
ALTER TABLE "AppConfig" ADD COLUMN IF NOT EXISTS "defaultInflationRate" DOUBLE PRECISION NOT NULL DEFAULT 0.45;
ALTER TABLE "AppConfig" ADD COLUMN IF NOT EXISTS "defaultInvestmentReturnRate" DOUBLE PRECISION NOT NULL DEFAULT 0.55;
ALTER TABLE "AppConfig" ADD COLUMN IF NOT EXISTS "defaultUsdTomanRate" INTEGER NOT NULL DEFAULT 90000;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ExpenseCategory" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "labelFa" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "defaultToman" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "telegramId" BIGINT,
    "locale" TEXT NOT NULL DEFAULT 'fa',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FreedomPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'fa',
    "expenseItems" JSONB NOT NULL,
    "totalMonthlyToman" DOUBLE PRECISION NOT NULL,
    "pathMode" TEXT NOT NULL,
    "yearsToFreedom" DOUBLE PRECISION,
    "monthlyInvestmentUsd" DOUBLE PRECISION,
    "usdTomanRate" DOUBLE PRECISION NOT NULL,
    "inflationRate" DOUBLE PRECISION NOT NULL,
    "investmentReturnRate" DOUBLE PRECISION NOT NULL,
    "currentSavingsUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthlyExpensesUsd" DOUBLE PRECISION NOT NULL,
    "annualExpensesUsd" DOUBLE PRECISION NOT NULL,
    "futureMonthlyToman" DOUBLE PRECISION NOT NULL,
    "freedomLineUsd" DOUBLE PRECISION NOT NULL,
    "requiredMonthlyUsd" DOUBLE PRECISION,
    "calculatedYears" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreedomPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ExpenseCategory_key_key" ON "ExpenseCategory"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "User_telegramId_key" ON "User"("telegramId");
CREATE INDEX IF NOT EXISTS "FreedomPlan_sessionId_idx" ON "FreedomPlan"("sessionId");
CREATE INDEX IF NOT EXISTS "FreedomPlan_userId_idx" ON "FreedomPlan"("userId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "FreedomPlan" ADD CONSTRAINT "FreedomPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

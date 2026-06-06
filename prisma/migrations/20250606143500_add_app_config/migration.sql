-- CreateTable
CREATE TABLE "AppConfig" (
    "id" TEXT NOT NULL,
    "defaultWithdrawalRate" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "defaultSavingsPercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppConfig_pkey" PRIMARY KEY ("id")
);

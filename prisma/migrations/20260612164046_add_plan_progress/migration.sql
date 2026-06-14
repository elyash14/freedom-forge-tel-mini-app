-- AlterTable
ALTER TABLE "AppConfig" ALTER COLUMN "id" SET DEFAULT 'default';

-- CreateTable
CREATE TABLE "PlanProgress" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "contribution" DOUBLE PRECISION NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanProgress_planId_idx" ON "PlanProgress"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "PlanProgress_planId_year_month_key" ON "PlanProgress"("planId", "year", "month");

-- AddForeignKey
ALTER TABLE "PlanProgress" ADD CONSTRAINT "PlanProgress_planId_fkey" FOREIGN KEY ("planId") REFERENCES "FreedomPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

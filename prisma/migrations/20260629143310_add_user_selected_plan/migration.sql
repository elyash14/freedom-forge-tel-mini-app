-- AlterTable
ALTER TABLE "User" ADD COLUMN     "selectedPlanId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_selectedPlanId_fkey" FOREIGN KEY ("selectedPlanId") REFERENCES "FreedomPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

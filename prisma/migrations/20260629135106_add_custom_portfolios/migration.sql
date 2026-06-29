-- CreateTable
CREATE TABLE "CustomPortfolio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "annualReturnRate" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomPortfolio_userId_idx" ON "CustomPortfolio"("userId");

-- AddForeignKey
ALTER TABLE "CustomPortfolio" ADD CONSTRAINT "CustomPortfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

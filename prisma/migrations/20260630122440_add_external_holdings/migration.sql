-- CreateTable
CREATE TABLE "ExternalHolding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalHolding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalHolding_userId_idx" ON "ExternalHolding"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalHolding_userId_assetKey_key" ON "ExternalHolding"("userId", "assetKey");

-- AddForeignKey
ALTER TABLE "ExternalHolding" ADD CONSTRAINT "ExternalHolding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

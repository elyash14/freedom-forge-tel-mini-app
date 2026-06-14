-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT;

-- Make telegramId required (delete orphan users without telegramId if any)
DELETE FROM "User" WHERE "telegramId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "telegramId" SET NOT NULL;

-- AlterTable
ALTER TABLE "FreedomPlan" ALTER COLUMN "sessionId" SET DEFAULT '';

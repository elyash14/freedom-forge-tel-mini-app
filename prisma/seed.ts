import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Placeholder 20-year average nominal returns — replace via settings after research.
const assetClasses = [
  {
    key: "stocks",
    labelFa: "بورس",
    labelEn: "Stock market",
    historicalNominalReturn: 0.35,
    sortOrder: 1,
  },
  {
    key: "gold",
    labelFa: "طلا",
    labelEn: "Gold",
    historicalNominalReturn: 0.28,
    sortOrder: 2,
  },
  {
    key: "crypto",
    labelFa: "کریپتو",
    labelEn: "Crypto",
    historicalNominalReturn: 0.4,
    sortOrder: 3,
  },
  {
    key: "bank",
    labelFa: "سپرده بانکی",
    labelEn: "Bank deposits",
    historicalNominalReturn: 0.22,
    sortOrder: 4,
  },
];

async function main() {
  await prisma.appConfig.upsert({
    where: { id: "default" },
    update: { defaultInflationRate: 0.45 },
    create: { id: "default", defaultInflationRate: 0.45 },
  });

  for (const asset of assetClasses) {
    await prisma.assetClass.upsert({
      where: { key: asset.key },
      update: {
        labelFa: asset.labelFa,
        labelEn: asset.labelEn,
        historicalNominalReturn: asset.historicalNominalReturn,
        sortOrder: asset.sortOrder,
      },
      create: asset,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

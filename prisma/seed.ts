import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const assetClasses = [
  {
    key: "stocks",
    labelFa: "بورس",
    labelEn: "Stock market",
    sortOrder: 1,
  },
  {
    key: "gold",
    labelFa: "طلا",
    labelEn: "Gold",
    sortOrder: 2,
  },
  {
    key: "investment_fund",
    labelFa: "صندوق سرمایه‌گذاری",
    labelEn: "Investment fund",
    sortOrder: 3,
  },
  {
    key: "crypto",
    labelFa: "کریپتو",
    labelEn: "Crypto",
    sortOrder: 4,
  },
  {
    key: "bank",
    labelFa: "سپرده بانکی",
    labelEn: "Bank deposits",
    sortOrder: 5,
  },
];

// Mock 20-year historical data (decimal rates). Replace with researched figures later.
const historicalReturns = [
  { year: 2005, inflation: 0.12, stockMarket: 0.18, gold: 0.15, bankDeposit: 0.14, investmentFund: 0.16, crypto: null },
  { year: 2006, inflation: 0.14, stockMarket: 0.22, gold: 0.2, bankDeposit: 0.15, investmentFund: 0.18, crypto: null },
  { year: 2007, inflation: 0.18, stockMarket: 0.35, gold: 0.25, bankDeposit: 0.16, investmentFund: 0.22, crypto: null },
  { year: 2008, inflation: 0.25, stockMarket: -0.15, gold: 0.3, bankDeposit: 0.18, investmentFund: -0.05, crypto: null },
  { year: 2009, inflation: 0.11, stockMarket: 0.45, gold: 0.22, bankDeposit: 0.17, investmentFund: 0.28, crypto: null },
  { year: 2010, inflation: 0.1, stockMarket: 0.28, gold: 0.35, bankDeposit: 0.16, investmentFund: 0.2, crypto: null },
  { year: 2011, inflation: 0.21, stockMarket: 0.12, gold: 0.4, bankDeposit: 0.18, investmentFund: 0.15, crypto: 0.5 },
  { year: 2012, inflation: 0.27, stockMarket: 0.2, gold: 0.18, bankDeposit: 0.19, investmentFund: 0.17, crypto: 1.2 },
  { year: 2013, inflation: 0.34, stockMarket: 0.48, gold: -0.1, bankDeposit: 0.2, investmentFund: 0.35, crypto: 5.5 },
  { year: 2014, inflation: 0.15, stockMarket: 0.25, gold: 0.05, bankDeposit: 0.18, investmentFund: 0.22, crypto: -0.4 },
  { year: 2015, inflation: 0.12, stockMarket: 0.08, gold: 0.02, bankDeposit: 0.17, investmentFund: 0.1, crypto: 0.35 },
  { year: 2016, inflation: 0.09, stockMarket: 0.35, gold: 0.22, bankDeposit: 0.16, investmentFund: 0.28, crypto: 0.75 },
  { year: 2017, inflation: 0.1, stockMarket: 0.42, gold: 0.12, bankDeposit: 0.15, investmentFund: 0.32, crypto: 1.4 },
  { year: 2018, inflation: 0.32, stockMarket: -0.22, gold: 0.08, bankDeposit: 0.2, investmentFund: -0.1, crypto: -0.65 },
  { year: 2019, inflation: 0.41, stockMarket: 0.55, gold: 0.35, bankDeposit: 0.22, investmentFund: 0.4, crypto: 0.9 },
  { year: 2020, inflation: 0.36, stockMarket: 1.2, gold: 0.55, bankDeposit: 0.18, investmentFund: 0.65, crypto: 3.0 },
  { year: 2021, inflation: 0.4, stockMarket: 0.38, gold: 0.1, bankDeposit: 0.2, investmentFund: 0.35, crypto: 0.6 },
  { year: 2022, inflation: 0.46, stockMarket: 0.05, gold: 0.42, bankDeposit: 0.21, investmentFund: 0.12, crypto: -0.55 },
  { year: 2023, inflation: 0.42, stockMarket: 0.32, gold: 0.28, bankDeposit: 0.22, investmentFund: 0.3, crypto: 1.55 },
  { year: 2024, inflation: 0.38, stockMarket: 0.28, gold: 0.32, bankDeposit: 0.23, investmentFund: 0.26, crypto: 1.2 },
];

async function main() {
  await prisma.appConfig.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  for (const asset of assetClasses) {
    await prisma.assetClass.upsert({
      where: { key: asset.key },
      update: {
        labelFa: asset.labelFa,
        labelEn: asset.labelEn,
        sortOrder: asset.sortOrder,
      },
      create: asset,
    });
  }

  for (const row of historicalReturns) {
    await prisma.historicalReturn.upsert({
      where: { year: row.year },
      update: row,
      create: row,
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

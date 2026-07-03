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
    color: "#6C9BCF",
    sortOrder: 1,
  },
  {
    key: "gold",
    labelFa: "طلا",
    labelEn: "Gold",
    color: "#E8B86D",
    sortOrder: 2,
  },
  {
    key: "investment_fund",
    labelFa: "صندوق سرمایه‌گذاری",
    labelEn: "Investment fund",
    color: "#7DD3C0",
    sortOrder: 3,
  },
  {
    key: "crypto",
    labelFa: "کریپتو",
    labelEn: "Crypto",
    color: "#B794F6",
    sortOrder: 4,
  },
  {
    key: "bank",
    labelFa: "سپرده بانکی",
    labelEn: "Bank deposits",
    color: "#4FD1C5",
    sortOrder: 5,
  },
  {
    key: "dollar",
    labelFa: "سبد دلار",
    labelEn: "Dollar portfolio",
    color: "#94A3B8",
    sortOrder: 6,
  },
];

// Nominal annual returns (decimal). Stock market: TEDPIX (شاخص قیمت و بازده نقدی),
// solar-year returns mapped to Gregorian year label (solar + 621).
// Gold: طلای ۱۸ عیار — میانگین سالانه (taline.ir 1394-1404), میانگین سالانه سکه/طلا (goldpricetoday 1384-1393).
// Dollar: دلار آزاد — میانگین سالانه (taline.ir 1394-1404), asriran/jamaran 1384-1393; 1404 fararu Esfand-to-Esfand 57.3%.
// Crypto: بیت‌کوین — USD calendar (StatMuse 1390-1402); balinex/arzdigital/iranbroker IRR (1403-1405).
// Bank deposit: سپرده یک‌ساله — مصوب شورای پول و اعتبار (ensani/1387-1390, tabnak history, CBI 1403-1404).
// Investment fund: میانگین بازده سالانه — دسته‌های اصلی (rade 1403, agah 1402, tsemag 1398-1402, donya 1396, bourse24 1404).
// Stock market: TEDPIX. Inflation: World Bank (through 1403), مرکز آمار (1404-1405).
// 1405 row is preliminary (year in progress; bourse reopened 29 Ordibehesht).
const historicalReturns = [
  { year: 2005, inflation: 0.1343, stockMarket: -0.127, gold: 0.175, bankDeposit: 0.16, investmentFund: 0.17, crypto: null, dollar: 0.034 },
  { year: 2006, inflation: 0.1002, stockMarket: 0.146, gold: 0.367, bankDeposit: 0.16, investmentFund: 0.17, crypto: null, dollar: 0.020 },
  { year: 2007, inflation: 0.1734, stockMarket: 0.53, gold: 0.135, bankDeposit: 0.16, investmentFund: 0.16, crypto: null, dollar: 0.014 },
  { year: 2008, inflation: 0.2541, stockMarket: -0.113, gold: 0.215, bankDeposit: 0.17, investmentFund: 0.15, crypto: null, dollar: 0.033 },
  { year: 2009, inflation: 0.1355, stockMarket: 0.588, gold: 0.243, bankDeposit: 0.15, investmentFund: 0.14, crypto: null, dollar: 0.035 },
  { year: 2010, inflation: 0.1009, stockMarket: 0.85, gold: 0.510, bankDeposit: 0.14, investmentFund: 0.14, crypto: null, dollar: 0.10 },
  { year: 2011, inflation: 0.2629, stockMarket: 0.09, gold: 0.448, bankDeposit: 0.125, investmentFund: 0.16, crypto: 14.374, dollar: 0.727 },
  { year: 2012, inflation: 0.2726, stockMarket: 0.44, gold: 0.444, bankDeposit: 0.20, investmentFund: 0.25, crypto: 1.933, dollar: 0.558 },
  { year: 2013, inflation: 0.3660, stockMarket: 1.05, gold: 0.154, bankDeposit: 0.20, investmentFund: 0.22, crypto: 54.630, dollar: 0.014 },
  { year: 2014, inflation: 0.1661, stockMarket: -0.21, gold: -0.099, bankDeposit: 0.22, investmentFund: 0.15, crypto: -0.576, dollar: 0.10 },
  { year: 2015, inflation: 0.1248, stockMarket: 0.27, gold: -0.04, bankDeposit: 0.20, investmentFund: 0.22, crypto: 0.344, dollar: 0.03 },
  { year: 2016, inflation: 0.0725, stockMarket: -0.048, gold: 0.18, bankDeposit: 0.15, investmentFund: 0.20, crypto: 1.238, dollar: 0.06 },
  { year: 2017, inflation: 0.0804, stockMarket: 0.24, gold: 0.06, bankDeposit: 0.15, investmentFund: 0.20, crypto: 13.690, dollar: 0.17 },
  { year: 2018, inflation: 0.1801, stockMarket: 0.85, gold: 2.33, bankDeposit: 0.15, investmentFund: 0.12, crypto: -0.735, dollar: 1.98 },
  { year: 2019, inflation: 0.3991, stockMarket: 2.10, gold: 0.03, bankDeposit: 0.15, investmentFund: 0.975, crypto: 0.920, dollar: 0.08 },
  { year: 2020, inflation: 0.3059, stockMarket: 1.58, gold: 1.91, bankDeposit: 0.16, investmentFund: 0.88, crypto: 3.031, dollar: 0.81 },
  { year: 2021, inflation: 0.4339, stockMarket: 0.044, gold: 0.02, bankDeposit: 0.18, investmentFund: 0.117, crypto: 0.597, dollar: 0.06 },
  { year: 2022, inflation: 0.4349, stockMarket: 0.45, gold: 1.13, bankDeposit: 0.225, investmentFund: 0.395, crypto: -0.643, dollar: 0.42 },
  { year: 2023, inflation: 0.4458, stockMarket: 0.1043, gold: 0.24, bankDeposit: 0.225, investmentFund: 0.215, crypto: 1.554, dollar: 0.38 },
  { year: 2024, inflation: 0.3246, stockMarket: 0.23, gold: 0.56, bankDeposit: 0.205, investmentFund: 0.26, crypto: 0.25, dollar: 0.21 },
  // 1404 — gold +112%, dollar +57.3%, BTC +37% IRR, bank 20.5%, funds ~31% (AUM-weighted categories)
  { year: 2025, inflation: 0.506, stockMarket: 0.365, gold: 1.12, bankDeposit: 0.205, investmentFund: 0.31, crypto: 0.37, dollar: 0.573 },
  // 1405 — preliminary YTD
  { year: 2026, inflation: 0.577, stockMarket: 0.174, gold: 0.099, bankDeposit: 0.205, investmentFund: 0.19, crypto: 0.12, dollar: 0.168 },
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
        color: asset.color,
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

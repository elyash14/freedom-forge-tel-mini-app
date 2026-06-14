import type { PortfolioAllocation } from "@/lib/freedom-calculator";
import { normalizeAllocation } from "@/lib/freedom-calculator";

export type HistoricalReturnRow = {
  year: number;
  inflation: number;
  stockMarket: number;
  gold: number;
  bankDeposit: number;
  investmentFund: number;
  crypto: number | null;
  dollar: number;
};

export const PORTFOLIO_ASSET_KEYS = [
  "stocks",
  "gold",
  "bank",
  "investment_fund",
  "crypto",
  "dollar",
] as const;

export type PortfolioAssetKey = (typeof PORTFOLIO_ASSET_KEYS)[number];

export type HistoricalReturnAssetColumn =
  | "stockMarket"
  | "gold"
  | "bankDeposit"
  | "investmentFund"
  | "crypto"
  | "dollar";

export const ASSET_KEY_TO_HISTORICAL_COLUMN: Record<
  PortfolioAssetKey,
  HistoricalReturnAssetColumn
> = {
  stocks: "stockMarket",
  gold: "gold",
  bank: "bankDeposit",
  investment_fund: "investmentFund",
  crypto: "crypto",
  dollar: "dollar",
};

const WEIGHT_TO_COLUMN = ASSET_KEY_TO_HISTORICAL_COLUMN;

export function getAssetReturnForYear(
  row: HistoricalReturnRow,
  assetKey: PortfolioAssetKey,
): number {
  const column = WEIGHT_TO_COLUMN[assetKey];
  const value = row[column];

  if (value == null) {
    return 0;
  }

  return value;
}

export function calculateYearNominalPortfolioReturn(
  row: HistoricalReturnRow,
  weights: PortfolioAllocation,
): number {
  const normalized = normalizeAllocation(weights, [...PORTFOLIO_ASSET_KEYS]);

  return PORTFOLIO_ASSET_KEYS.reduce((sum, key) => {
    return sum + (normalized[key] ?? 0) * getAssetReturnForYear(row, key);
  }, 0);
}

export function calculateYearRealReturn(
  nominalReturn: number,
  inflation: number,
): number {
  return (1 + nominalReturn) / (1 + inflation) - 1;
}

export function calculateHistoricalRealReturn(
  weights: PortfolioAllocation,
  historicalData: HistoricalReturnRow[],
): number {
  if (historicalData.length === 0) {
    return 0;
  }

  let logSum = 0;

  for (const row of historicalData) {
    const nominal = calculateYearNominalPortfolioReturn(row, weights);
    const real = calculateYearRealReturn(nominal, row.inflation);
    logSum += Math.log(1 + real);
  }

  return Math.exp(logSum / historicalData.length) - 1;
}

export function calculateHistoricalNominalReturn(
  weights: PortfolioAllocation,
  historicalData: HistoricalReturnRow[],
): number {
  if (historicalData.length === 0) {
    return 0;
  }

  const total = historicalData.reduce((sum, row) => {
    return sum + calculateYearNominalPortfolioReturn(row, weights);
  }, 0);

  return total / historicalData.length;
}

export function calculateExpectedInflation(
  historicalData: HistoricalReturnRow[],
): number {
  if (historicalData.length === 0) {
    return 0;
  }

  let logSum = 0;

  for (const row of historicalData) {
    logSum += Math.log(1 + row.inflation);
  }

  return Math.exp(logSum / historicalData.length) - 1;
}

export function realToNominalReturn(
  realReturnRate: number,
  avgInflation: number,
): number {
  return (1 + realReturnRate) * (1 + avgInflation) - 1;
}

export const MAX_FUTURE_INFLATION = 0.8;

export function capFutureInflation(rate: number): number {
  return Math.min(Math.max(rate, 0), MAX_FUTURE_INFLATION);
}

export function calculateInflationDelta(
  historicalData: HistoricalReturnRow[],
  windowYears = 5,
): number {
  if (historicalData.length < 2) {
    return 0;
  }

  const sorted = [...historicalData].sort((a, b) => a.year - b.year);
  const startIdx = Math.max(1, sorted.length - windowYears);
  const deltas: number[] = [];

  for (let i = startIdx; i < sorted.length; i++) {
    deltas.push(sorted[i].inflation - sorted[i - 1].inflation);
  }

  if (deltas.length === 0) {
    return 0;
  }

  return deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length;
}

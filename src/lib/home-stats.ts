import type { Locale } from "@/i18n/config";
import { formatInteger } from "@/lib/freedom-format";

export type PlanProgressPoint = {
  year: number;
  month: number;
};

export type AssetBreakdownItem = {
  key: string;
  label: string;
  value: number;
};

export function toMonthIndex(point: PlanProgressPoint): number {
  return (point.year - 1) * 12 + point.month;
}

export function calculateElapsedMonths(
  progress: PlanProgressPoint[],
): number {
  if (progress.length === 0) {
    return 0;
  }

  const sorted = [...progress].sort(
    (a, b) => toMonthIndex(a) - toMonthIndex(b),
  );
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];

  return toMonthIndex(latest) - toMonthIndex(first) + 1;
}

export function calculateRemainingMonths(
  yearsToFreedom: number,
  elapsedMonths: number,
): number {
  const totalMonths = Math.round(yearsToFreedom * 12);
  return Math.max(0, totalMonths - elapsedMonths);
}

export function formatYearsAndMonths(months: number, locale: Locale): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const yearLabel = locale === "fa" ? "سال" : "yr";
  const monthLabel = locale === "fa" ? "ماه" : "mo";

  if (years === 0) {
    return `${formatInteger(remainingMonths, locale)} ${monthLabel}`;
  }

  if (remainingMonths === 0) {
    return `${formatInteger(years, locale)} ${yearLabel}`;
  }

  return `${formatInteger(years, locale)} ${yearLabel} ${formatInteger(remainingMonths, locale)} ${monthLabel}`;
}

export function buildAssetBreakdown(
  assetDetails: Record<string, { totalValue?: number }> | null | undefined,
  assetCapitals: Record<string, number> | null | undefined,
  assetLabels: Record<string, string>,
): AssetBreakdownItem[] {
  const source =
    assetDetails && Object.keys(assetDetails).length > 0
      ? Object.fromEntries(
          Object.entries(assetDetails).map(([key, value]) => [
            key,
            value.totalValue ?? 0,
          ]),
        )
      : (assetCapitals ?? {});

  return Object.entries(source)
    .map(([key, value]) => ({
      key,
      label: assetLabels[key] ?? key,
      value: Number(value) || 0,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

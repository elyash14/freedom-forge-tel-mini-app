import {
  normalizeNumericString,
  parseLocalizedNumber,
} from "@/lib/numeric-input";
import type { HistoricalReturnRow } from "@/lib/historical-returns";

export function decimalToPercentInput(value: number | null): string {
  if (value == null) {
    return "";
  }

  const percent = value * 100;
  const rounded = Math.round(percent * 100) / 100;

  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function percentInputToDecimal(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed || trimmed === "—") {
    return null;
  }

  const parsed = parseLocalizedNumber(trimmed);

  if (parsed == null) {
    return null;
  }

  return parsed / 100;
}

export function isPartialPercentInput(value: string): boolean {
  return /^-?$|^-?\d*\.?\d*$/.test(normalizeNumericString(value.trim()));
}

export function historicalInputKey(
  year: number,
  field: keyof HistoricalReturnRow,
): string {
  return `${year}:${field}`;
}

export type AssetClassDto = {
  id: string;
  key: string;
  labelFa: string;
  labelEn: string;
  color: string;
};

export function assetLabel(asset: AssetClassDto, locale: "fa" | "en"): string {
  return locale === "fa" ? asset.labelFa : asset.labelEn;
}

import { customPortfolioKey } from "@/lib/custom-portfolios";

export const DEFAULT_ASSET_COLORS = [
  "#6C9BCF",
  "#7DD3C0",
  "#E8B86D",
  "#B794F6",
  "#F687B3",
  "#4FD1C5",
  "#FCA5A5",
  "#94A3B8",
] as const;

/** @deprecated Use DEFAULT_ASSET_COLORS */
export const ASSET_COLORS = DEFAULT_ASSET_COLORS;

export function defaultColorForIndex(index: number): string {
  return DEFAULT_ASSET_COLORS[index % DEFAULT_ASSET_COLORS.length]!;
}

export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function colorForKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash + key.charCodeAt(i) * (i + 1)) % DEFAULT_ASSET_COLORS.length;
  }
  return DEFAULT_ASSET_COLORS[hash]!;
}

export function resolveAssetColor(
  key: string,
  colorMap?: Record<string, string> | null,
): string {
  const mapped = colorMap?.[key];
  if (mapped && isValidHexColor(mapped)) {
    return mapped;
  }

  return colorForKey(key);
}

export function buildAssetColorMap(
  assetClasses: { key: string; color: string }[],
  customPortfolios: { id: string; color: string }[] = [],
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const asset of assetClasses) {
    if (isValidHexColor(asset.color)) {
      map[asset.key] = asset.color;
    }
  }

  for (const portfolio of customPortfolios) {
    if (isValidHexColor(portfolio.color)) {
      map[customPortfolioKey(portfolio.id)] = portfolio.color;
    }
  }

  return map;
}

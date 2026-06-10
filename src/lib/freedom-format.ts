import type { Locale } from "@/i18n/config";

function numberFormatLocale(locale: Locale): string {
  return locale === "fa" ? "fa-IR" : "en-US";
}

export function formatUsd(value: number, locale: Locale): string {
  return new Intl.NumberFormat(numberFormatLocale(locale), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatToman(value: number, locale: Locale): string {
  return new Intl.NumberFormat(numberFormatLocale(locale)).format(
    Math.round(value),
  );
}

export function formatTomanCompact(value: number, locale: Locale): string {
  const abs = Math.abs(value);
  const fmt = new Intl.NumberFormat(numberFormatLocale(locale), {
    maximumFractionDigits: abs >= 100_000_000 ? 1 : 2,
  });

  if (abs >= 1_000_000_000) {
    return locale === "fa"
      ? `${fmt.format(value / 1_000_000_000)} میلیارد`
      : `${fmt.format(value / 1_000_000_000)}B`;
  }

  if (abs >= 1_000_000) {
    return locale === "fa"
      ? `${fmt.format(value / 1_000_000)} میلیون`
      : `${fmt.format(value / 1_000_000)}M`;
  }

  return formatToman(value, locale);
}

export function formatPercent(value: number, locale: Locale): string {
  return new Intl.NumberFormat(numberFormatLocale(locale), {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatYears(value: number, locale: Locale): string {
  const rounded =
    value < 10 ? Math.round(value * 10) / 10 : Math.round(value);

  return new Intl.NumberFormat(numberFormatLocale(locale), {
    maximumFractionDigits: 1,
  }).format(rounded);
}

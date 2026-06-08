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

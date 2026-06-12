import type { Locale } from "@/i18n/config";

function numberFormatLocale(locale: Locale): string {
  return locale === "fa" ? "fa-IR" : "en-US";
}

function jalaliYearFromDate(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-u-ca-persian", {
    year: "numeric",
  }).formatToParts(date);

  const yearPart = parts.find((part) => part.type === "year")?.value;
  const year = Number(yearPart);

  if (!Number.isFinite(year)) {
    throw new Error(`Failed to parse Jalali year from date: ${date.toISOString()}`);
  }

  return year;
}

export function gregorianYearToJalaliYear(gregorianYear: number): number {
  return jalaliYearFromDate(new Date(gregorianYear, 6, 1));
}

export function getCurrentJalaliYear(): number {
  return jalaliYearFromDate(new Date());
}

export function formatInteger(value: number, locale: Locale): string {
  return new Intl.NumberFormat(numberFormatLocale(locale)).format(value);
}

function formatYearNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(numberFormatLocale(locale), {
    useGrouping: false,
  }).format(value);
}

/** Historical DB years are Gregorian; show Jalali in Persian UI. */
export function formatHistoricalYear(
  gregorianYear: number,
  locale: Locale,
): string {
  if (locale !== "fa") {
    return formatYearNumber(gregorianYear, locale);
  }

  return formatYearNumber(gregorianYearToJalaliYear(gregorianYear), locale);
}

/** Projection row index → calendar year from today. */
export function formatProjectionCalendarYear(
  projectionYear: number,
  locale: Locale,
): string {
  const baseYear =
    locale === "fa"
      ? getCurrentJalaliYear()
      : new Date().getFullYear();

  return formatYearNumber(baseYear + projectionYear - 1, locale);
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

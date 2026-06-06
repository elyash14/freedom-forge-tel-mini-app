import type { Locale } from "@/i18n/config";
import type { ValidationErrorKey } from "@/i18n/types";

export type FreedomInputs = {
  monthlyExpensesToman: number;
  usdTomanRate: number;
  withdrawalRate: number;
};

export type FreedomResult = {
  monthlyExpensesUsd: number;
  annualExpensesUsd: number;
  freedomLineUsd: number;
};

export type FreedomValidation = {
  isValid: boolean;
  errors: ValidationErrorKey[];
};

export function validateFreedomInputs(
  inputs: FreedomInputs,
): FreedomValidation {
  const errors: ValidationErrorKey[] = [];

  if (inputs.monthlyExpensesToman <= 0) {
    errors.push("expensesRequired");
  }

  if (inputs.usdTomanRate <= 0) {
    errors.push("rateRequired");
  }

  if (inputs.withdrawalRate <= 0 || inputs.withdrawalRate > 1) {
    errors.push("withdrawalInvalid");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function calculateFreedomLine(
  inputs: FreedomInputs,
): FreedomResult | null {
  const validation = validateFreedomInputs(inputs);
  if (!validation.isValid) {
    return null;
  }

  const monthlyExpensesUsd = inputs.monthlyExpensesToman / inputs.usdTomanRate;
  const annualExpensesUsd = monthlyExpensesUsd * 12;
  const freedomLineUsd = annualExpensesUsd / inputs.withdrawalRate;

  return {
    monthlyExpensesUsd,
    annualExpensesUsd,
    freedomLineUsd,
  };
}

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

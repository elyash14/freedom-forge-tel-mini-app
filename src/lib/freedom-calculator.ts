import type { Locale } from "@/i18n/config";
import type { ValidationErrorKey } from "@/i18n/types";

export type PathMode = "yearsToInvest" | "monthlyToYears";

export type FreedomInputs = {
  monthlyExpensesToman: number;
  usdTomanRate: number;
  investmentReturnRate: number;
  currentSavingsUsd: number;
  mode: PathMode;
  yearsToFreedom: number;
  monthlyInvestmentUsd: number;
};

export type FreedomResult = {
  monthlyExpensesUsd: number;
  annualExpensesUsd: number;
  freedomLineUsd: number;
  monthlyInvestmentUsd: number | null;
  yearsToFreedom: number | null;
};

export type FreedomValidation = {
  isValid: boolean;
  errors: ValidationErrorKey[];
};

function monthlyRate(annualRate: number): number {
  return (1 + annualRate) ** (1 / 12) - 1;
}

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

  if (inputs.investmentReturnRate <= 0 || inputs.investmentReturnRate > 1) {
    errors.push("investmentReturnInvalid");
  }

  if (inputs.currentSavingsUsd < 0) {
    errors.push("currentSavingsInvalid");
  }

  if (inputs.mode === "yearsToInvest" && inputs.yearsToFreedom <= 0) {
    errors.push("yearsRequired");
  }

  if (inputs.mode === "monthlyToYears" && inputs.monthlyInvestmentUsd <= 0) {
    errors.push("monthlyInvestmentRequired");
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
  const freedomLineUsd = annualExpensesUsd / inputs.investmentReturnRate;

  if (inputs.mode === "yearsToInvest") {
    const monthlyInvestmentUsd = calculateRequiredMonthlyInvestment(
      freedomLineUsd,
      inputs.currentSavingsUsd,
      inputs.investmentReturnRate,
      inputs.yearsToFreedom,
    );

    return {
      monthlyExpensesUsd,
      annualExpensesUsd,
      freedomLineUsd,
      monthlyInvestmentUsd,
      yearsToFreedom: inputs.yearsToFreedom,
    };
  }

  const yearsToFreedom = calculateYearsToFreedom(
    freedomLineUsd,
    inputs.currentSavingsUsd,
    inputs.investmentReturnRate,
    inputs.monthlyInvestmentUsd,
  );

  if (yearsToFreedom === null) {
    return null;
  }

  return {
    monthlyExpensesUsd,
    annualExpensesUsd,
    freedomLineUsd,
    monthlyInvestmentUsd: inputs.monthlyInvestmentUsd,
    yearsToFreedom,
  };
}

export function calculateRequiredMonthlyInvestment(
  freedomLineUsd: number,
  currentSavingsUsd: number,
  annualReturnRate: number,
  years: number,
): number {
  const months = years * 12;
  const rate = monthlyRate(annualReturnRate);
  const compoundedSavings = currentSavingsUsd * (1 + rate) ** months;
  const remaining = freedomLineUsd - compoundedSavings;

  if (remaining <= 0) {
    return 0;
  }

  const factor = (1 + rate) ** months - 1;
  return (remaining * rate) / factor;
}

export function calculateYearsToFreedom(
  freedomLineUsd: number,
  currentSavingsUsd: number,
  annualReturnRate: number,
  monthlyInvestmentUsd: number,
): number | null {
  if (currentSavingsUsd >= freedomLineUsd) {
    return 0;
  }

  const rate = monthlyRate(annualReturnRate);
  const investment = monthlyInvestmentUsd;

  if (investment <= 0) {
    return null;
  }

  const growthBase = currentSavingsUsd + investment / rate;

  if (growthBase <= 0) {
    return null;
  }

  const targetFactor = (freedomLineUsd + investment / rate) / growthBase;

  if (targetFactor <= 1) {
    return null;
  }

  const months = Math.log(targetFactor) / Math.log(1 + rate);
  return months / 12;
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

export function formatYears(value: number, locale: Locale): string {
  const rounded =
    value < 10
      ? Math.round(value * 10) / 10
      : Math.round(value);

  return new Intl.NumberFormat(numberFormatLocale(locale), {
    maximumFractionDigits: 1,
  }).format(rounded);
}

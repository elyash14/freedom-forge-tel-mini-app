import type { Dictionary } from "../types";

export const en = {
  meta: {
    title: "FreedomForge",
    description: "Calculate your Financial Freedom Line",
  },
  calculator: {
    title: "FreedomForge",
    subtitle:
      "Calculate your Financial Freedom Line. All amounts stay on your device.",
    cardTitle: "Calculator",
    cardDescription:
      "Enter your monthly expenses in Toman. Results update instantly.",
    monthlyExpenses: "Monthly expenses (Toman)",
    monthlyExpensesPlaceholder: "e.g. 50000000",
    toman: "Toman",
    savingsGoal: "Savings goal (%)",
    savingsGoalHint: "Target: {percent}% of income (display only for now)",
    usdTomanRate: "USD/Toman rate",
    refresh: "Refresh",
    rateSource: "Source",
    rateSourceLive: "Live API",
    rateSourceFallback: "Fallback",
    rateSourceManual: "Manual override",
    withdrawalRate: "Safe withdrawal rate",
    loadError:
      "Could not load defaults. You can still enter values manually.",
    refreshError: "Could not refresh exchange rate.",
  },
  gauge: {
    title: "Financial Freedom Line",
    subtitle: "Capital needed to sustain your lifestyle",
    monthlyUsd: "Monthly (USD)",
    annualUsd: "Annual (USD)",
  },
  validation: {
    expensesRequired: "Monthly expenses must be greater than zero.",
    rateRequired: "USD/Toman rate must be greater than zero.",
    withdrawalInvalid: "Withdrawal rate must be between 0 and 1.",
  },
  language: {
    label: "Language",
    en: "English",
    fa: "فارسی",
  },
} as const satisfies Dictionary;

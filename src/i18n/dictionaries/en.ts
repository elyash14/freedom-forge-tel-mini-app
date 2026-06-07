import type { Dictionary } from "../types";

export const en = {
  meta: {
    title: "FreedomForge",
    description: "Calculate your inflation-resistant financial freedom line",
  },
  calculator: {
    title: "FreedomForge",
    subtitle:
      "Convert today's expenses to a fixed USD lifestyle target and plan your path to freedom.",
    cardTitle: "Freedom Line Calculator",
    cardDescription:
      "Today's Toman expenses → fixed USD. Investment return should beat inflation.",
    monthlyExpenses: "Today's monthly expenses (Toman)",
    monthlyExpensesHint:
      "What you spend now; on freedom day you target the same lifestyle in fixed USD.",
    monthlyExpensesPlaceholder: "e.g. 50000000",
    toman: "Toman",
    usdTomanRate: "USD/Toman rate (today)",
    usdTomanHint:
      "Converts Toman costs to a fixed USD anchor; Iranian inflation won't change this USD target.",
    refresh: "Refresh",
    rateSource: "Source",
    rateSourceLive: "Live API",
    rateSourceFallback: "Fallback",
    rateSourceManual: "Manual override",
    investmentReturnRate: "Average annual investment return",
    investmentReturnHint:
      "Real annual return you expect above inflation (gold, FX, stocks, crypto, etc.).",
    currentSavingsUsd: "Current savings (USD)",
    currentSavingsHint: "Total USD assets you already have (optional, defaults to zero).",
    pathTitle: "Path to freedom",
    modeYears: "I know my timeline",
    modeYearsDescription: "How many years? → required monthly investment",
    modeMonthly: "I know my monthly budget",
    modeMonthlyDescription: "How much USD per month? → years to freedom",
    yearsToFreedom: "Years to freedom",
    yearsToFreedomPlaceholder: "e.g. 10",
    monthlyInvestmentUsd: "Monthly investment (USD)",
    monthlyInvestmentPlaceholder: "e.g. 500",
    loadError:
      "Could not load defaults. You can still enter values manually.",
    refreshError: "Could not refresh exchange rate.",
    pathUnreachable:
      "This monthly amount won't reach your freedom line. Increase it or adjust return/time.",
  },
  gauge: {
    title: "Freedom Line (USD)",
    subtitle:
      "Capital whose annual return covers your fixed USD living costs",
    monthlyUsd: "Monthly cost (USD)",
    annualUsd: "Annual cost (USD)",
    monthlyInvestment: "Required monthly investment",
    yearsToFreedom: "Time to freedom",
    yearsUnit: "years",
    alreadyFree: "You've reached your freedom line!",
  },
  validation: {
    expensesRequired: "Monthly expenses must be greater than zero.",
    rateRequired: "USD/Toman rate must be greater than zero.",
    investmentReturnInvalid: "Investment return must be between 0 and 100%.",
    currentSavingsInvalid: "Current savings cannot be negative.",
    yearsRequired: "Years must be greater than zero.",
    monthlyInvestmentRequired: "Monthly investment must be greater than zero.",
  },
  language: {
    label: "Language",
    en: "English",
    fa: "فارسی",
  },
} as const satisfies Dictionary;

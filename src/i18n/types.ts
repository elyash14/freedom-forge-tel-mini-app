export type Dictionary = {
  meta: {
    title: string;
    description: string;
  };
  calculator: {
    title: string;
    subtitle: string;
    cardTitle: string;
    cardDescription: string;
    monthlyExpenses: string;
    monthlyExpensesHint: string;
    monthlyExpensesPlaceholder: string;
    toman: string;
    usdTomanRate: string;
    usdTomanHint: string;
    refresh: string;
    rateSource: string;
    rateSourceLive: string;
    rateSourceFallback: string;
    rateSourceManual: string;
    investmentReturnRate: string;
    investmentReturnHint: string;
    currentSavingsUsd: string;
    currentSavingsHint: string;
    pathTitle: string;
    modeYears: string;
    modeYearsDescription: string;
    modeMonthly: string;
    modeMonthlyDescription: string;
    yearsToFreedom: string;
    yearsToFreedomPlaceholder: string;
    monthlyInvestmentUsd: string;
    monthlyInvestmentPlaceholder: string;
    loadError: string;
    refreshError: string;
    pathUnreachable: string;
  };
  gauge: {
    title: string;
    subtitle: string;
    monthlyUsd: string;
    annualUsd: string;
    monthlyInvestment: string;
    yearsToFreedom: string;
    yearsUnit: string;
    alreadyFree: string;
  };
  validation: {
    expensesRequired: string;
    rateRequired: string;
    investmentReturnInvalid: string;
    currentSavingsInvalid: string;
    yearsRequired: string;
    monthlyInvestmentRequired: string;
  };
  language: {
    label: string;
    en: string;
    fa: string;
  };
};

export type ValidationErrorKey = keyof Dictionary["validation"];

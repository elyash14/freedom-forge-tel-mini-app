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
    monthlyExpensesPlaceholder: string;
    toman: string;
    savingsGoal: string;
    savingsGoalHint: string;
    usdTomanRate: string;
    refresh: string;
    rateSource: string;
    rateSourceLive: string;
    rateSourceFallback: string;
    rateSourceManual: string;
    withdrawalRate: string;
    loadError: string;
    refreshError: string;
  };
  gauge: {
    title: string;
    subtitle: string;
    monthlyUsd: string;
    annualUsd: string;
  };
  validation: {
    expensesRequired: string;
    rateRequired: string;
    withdrawalInvalid: string;
  };
  language: {
    label: string;
    en: string;
    fa: string;
  };
};

export type ValidationErrorKey = keyof Dictionary["validation"];

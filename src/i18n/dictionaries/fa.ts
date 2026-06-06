import type { Dictionary } from "../types";

export const fa = {
  meta: {
    title: "فریدام‌فورج",
    description: "محاسبه خط آزادی مالی",
  },
  calculator: {
    title: "فریدام‌فورج",
    subtitle:
      "خط آزادی مالی خود را محاسبه کنید. همه مبالغ فقط روی دستگاه شما می‌مانند.",
    cardTitle: "ماشین‌حساب",
    cardDescription:
      "هزینه ماهانه خود را به تومان وارد کنید. نتایج فوراً به‌روز می‌شوند.",
    monthlyExpenses: "هزینه ماهانه (تومان)",
    monthlyExpensesPlaceholder: "مثلاً ۵۰۰۰۰۰۰۰",
    toman: "تومان",
    savingsGoal: "هدف پس‌انداز (%)",
    savingsGoalHint: "هدف: {percent}٪ از درآمد (فعلاً فقط نمایشی)",
    usdTomanRate: "نرخ دلار/تومان",
    refresh: "به‌روزرسانی",
    rateSource: "منبع",
    rateSourceLive: "API زنده",
    rateSourceFallback: "پیش‌فرض",
    rateSourceManual: "دستی",
    withdrawalRate: "نرخ برداشت امن",
    loadError:
      "بارگذاری تنظیمات پیش‌فرض ممکن نشد. می‌توانید مقادیر را دستی وارد کنید.",
    refreshError: "به‌روزرسانی نرخ ارز ممکن نشد.",
  },
  gauge: {
    title: "خط آزادی مالی",
    subtitle: "سرمایه لازم برای حفظ سبک زندگی شما",
    monthlyUsd: "ماهانه (دلار)",
    annualUsd: "سالانه (دلار)",
  },
  validation: {
    expensesRequired: "هزینه ماهانه باید بیشتر از صفر باشد.",
    rateRequired: "نرخ دلار/تومان باید بیشتر از صفر باشد.",
    withdrawalInvalid: "نرخ برداشت باید بین ۰ و ۱ باشد.",
  },
  language: {
    label: "زبان",
    en: "English",
    fa: "فارسی",
  },
} as const satisfies Dictionary;

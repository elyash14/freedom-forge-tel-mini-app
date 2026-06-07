import type { Dictionary } from "../types";

export const fa = {
  meta: {
    title: "فریدام‌فورج",
    description: "محاسبه خط آزادی مالی مقاوم در برابر تورم",
  },
  calculator: {
    title: "فریدام‌فورج",
    subtitle:
      "هزینه‌های امروزت را به دلار تبدیل کن، خط آزادی دلاری‌ات را ببین و مسیر رسیدن به آن را حساب کن.",
    cardTitle: "ماشین‌حساب خط آزادی",
    cardDescription:
      "هزینه ماهانه به تومان (نرخ امروز) → دلار ثابت. سود سرمایه‌گذاری باید بالاتر از تورم باشد.",
    monthlyExpenses: "هزینه ماهانه امروز (تومان)",
    monthlyExpensesHint:
      "هزینه‌ای که الان برای زندگی داری؛ در روز آزادی همین سبک زندگی را به دلار هدف می‌گیری.",
    monthlyExpensesPlaceholder: "مثلاً ۵۰۰۰۰۰۰۰",
    toman: "تومان",
    usdTomanRate: "نرخ دلار/تومان (امروز)",
    usdTomanHint:
      "برای تبدیل هزینه تومانی به دلار ثابت؛ تورم ایران روی این عدد دلاری اثر نمی‌گذارد.",
    refresh: "به‌روزرسانی",
    rateSource: "منبع",
    rateSourceLive: "API زنده",
    rateSourceFallback: "پیش‌فرض",
    rateSourceManual: "دستی",
    investmentReturnRate: "میانگین سود سالانه سرمایه‌گذاری",
    investmentReturnHint:
      "سود واقعی سالانه که بالاتر از تورم انتظار داری (مثلاً طلا، ارز، بورس، رمزارز).",
    currentSavingsUsd: "سرمایه فعلی (دلار)",
    currentSavingsHint: "مجموع دارایی دلاری که الان داری (اختیاری، پیش‌فرض صفر).",
    pathTitle: "مسیر رسیدن به خط آزادی",
    modeYears: "سال می‌دانم",
    modeYearsDescription: "چند سال فرصت داری؟ → پس‌انداز ماهانه لازم",
    modeMonthly: "مبلغ ماهانه می‌دانم",
    modeMonthlyDescription: "چقدر دلار در ماه می‌توانی بگذاری؟ → چند سال طول می‌کشد",
    yearsToFreedom: "سال تا خط آزادی",
    yearsToFreedomPlaceholder: "مثلاً ۱۰",
    monthlyInvestmentUsd: "سرمایه‌گذاری ماهانه (دلار)",
    monthlyInvestmentPlaceholder: "مثلاً ۵۰۰",
    loadError:
      "بارگذاری تنظیمات پیش‌فرض ممکن نشد. می‌توانید مقادیر را دستی وارد کنید.",
    refreshError: "به‌روزرسانی نرخ ارز ممکن نشد.",
    pathUnreachable:
      "با این مبلغ ماهانه به خط آزادی نمی‌رسی. مبلغ را بیشتر کن یا سود/زمان را تنظیم کن.",
  },
  gauge: {
    title: "خط آزادی (دلار)",
    subtitle:
      "سرمایه‌ای که سود سالانه‌اش هزینه زندگی دلاری تو را پوشش دهد",
    monthlyUsd: "هزینه ماهانه (دلار)",
    annualUsd: "هزینه سالانه (دلار)",
    monthlyInvestment: "سرمایه‌گذاری ماهانه لازم",
    yearsToFreedom: "زمان تا خط آزادی",
    yearsUnit: "سال",
    alreadyFree: "به خط آزادی رسیدی!",
  },
  validation: {
    expensesRequired: "هزینه ماهانه باید بیشتر از صفر باشد.",
    rateRequired: "نرخ دلار/تومان باید بیشتر از صفر باشد.",
    investmentReturnInvalid: "نرخ سود سرمایه‌گذاری باید بین ۰ و ۱۰۰٪ باشد.",
    currentSavingsInvalid: "سرمایه فعلی نمی‌تواند منفی باشد.",
    yearsRequired: "تعداد سال باید بیشتر از صفر باشد.",
    monthlyInvestmentRequired: "مبلغ ماهانه باید بیشتر از صفر باشد.",
  },
  language: {
    label: "زبان",
    en: "English",
    fa: "فارسی",
  },
} as const satisfies Dictionary;

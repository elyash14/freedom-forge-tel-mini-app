import { FreedomCalculator } from "@/components/freedom-calculator/FreedomCalculator";
import { type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { notFound } from "next/navigation";

type CalculatorPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function CalculatorPage({ params }: CalculatorPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const dictionary = await getDictionary(typedLocale);

  return <FreedomCalculator locale={typedLocale} dictionary={dictionary} />;
}

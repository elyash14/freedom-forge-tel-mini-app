import { notFound } from "next/navigation";

import { FreedomCalculator } from "@/components/freedom-calculator/FreedomCalculator";
import { type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const dictionary = await getDictionary(typedLocale);

  return <FreedomCalculator locale={typedLocale} dictionary={dictionary} />;
}

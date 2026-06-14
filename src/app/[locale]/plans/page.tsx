import { notFound } from "next/navigation";

import { PlansListPage } from "@/components/plans/PlansListPage";
import { type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type PlansPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PlansPage({ params }: PlansPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const dictionary = await getDictionary(typedLocale);

  return <PlansListPage locale={typedLocale} dictionary={dictionary} />;
}

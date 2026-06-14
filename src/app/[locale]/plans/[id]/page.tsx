import { notFound } from "next/navigation";

import { PlanDashboard } from "@/components/plan-dashboard/PlanDashboard";
import { type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type PlanPageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function PlanPage({ params }: PlanPageProps) {
  const { locale, id } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const dictionary = await getDictionary(typedLocale);

  return (
    <PlanDashboard
      locale={typedLocale}
      planId={id}
      dictionary={dictionary}
    />
  );
}

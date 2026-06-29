import { redirect } from "next/navigation";

import { type Locale, locales } from "@/i18n/config";

type LocaleIndexPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LocaleIndexPage({ params }: LocaleIndexPageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    redirect("/fa/home");
  }

  redirect(`/${locale}/home`);
}

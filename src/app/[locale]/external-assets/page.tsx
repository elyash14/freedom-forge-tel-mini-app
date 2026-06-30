import { ExternalAssetsPage } from "@/components/external-assets/ExternalAssetsPage";
import { type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { notFound } from "next/navigation";

type ExternalAssetsRoutePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ExternalAssetsRoutePage({
  params,
}: ExternalAssetsRoutePageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const dictionary = await getDictionary(typedLocale);

  return (
    <ExternalAssetsPage locale={typedLocale} dictionary={dictionary} />
  );
}

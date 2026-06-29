import { HomePage } from "@/components/home/HomePage";
import { type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { notFound } from "next/navigation";

type HomeRoutePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HomeRoutePage({ params }: HomeRoutePageProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const dictionary = await getDictionary(typedLocale);

  return <HomePage locale={typedLocale} dictionary={dictionary} />;
}

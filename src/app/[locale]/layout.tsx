import type { Metadata } from "next";
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";
import { notFound } from "next/navigation";

import { localeDirection, type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

import "../globals.css";
import { TelegramProvider } from "@/components/telegram/telegram-provider";
import { AppShell } from "@/components/navigation/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic"],
});

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    return {};
  }

  const dictionary = await getDictionary(locale as Locale);

  return {
    title: dictionary.meta.title,
    description: dictionary.meta.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const typedLocale = locale as Locale;
  const dictionary = await getDictionary(typedLocale);
  const direction = localeDirection(typedLocale);
  const bodyFontClass =
    typedLocale === "fa" ? vazirmatn.className : geistSans.className;

  return (
    <html
      lang={typedLocale}
      dir={direction}
      className={`${geistMono.variable} h-full antialiased`}
    >
      <body className={`${bodyFontClass} flex h-full flex-col overflow-hidden`}>
        <TelegramProvider
          locale={typedLocale}
          loadingText={dictionary.telegram.loading}
        >
          <AppShell
            locale={typedLocale}
            navLabels={{
              home: dictionary.nav.home,
              calculator: dictionary.nav.calculator,
              plans: dictionary.nav.plans,
              externalAssets: dictionary.nav.externalAssets,
              settings: dictionary.nav.settings,
            }}
          >
            {children}
          </AppShell>
        </TelegramProvider>
      </body>
    </html>
  );
}

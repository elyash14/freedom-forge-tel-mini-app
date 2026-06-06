import type { Metadata } from "next";
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";
import { notFound } from "next/navigation";

import { localeDirection, type Locale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

import "../globals.css";

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
  const direction = localeDirection(typedLocale);
  const fontClass =
    typedLocale === "fa"
      ? `${vazirmatn.variable} ${geistMono.variable}`
      : `${geistSans.variable} ${geistMono.variable}`;

  return (
    <html
      lang={typedLocale}
      dir={direction}
      className={`${fontClass} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily:
            typedLocale === "fa"
              ? "var(--font-vazirmatn), Arial, sans-serif"
              : "var(--font-geist-sans), Arial, Helvetica, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}

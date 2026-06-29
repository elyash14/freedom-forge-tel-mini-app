"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { Locale } from "@/i18n/config";

import { BottomNav, useTelegramChromeGuard } from "./bottom-nav";
import { ScrollableMain } from "./scrollable-main";

type AppShellProps = {
  locale: Locale;
  navLabels: {
    home: string;
    calculator: string;
    plans: string;
    settings: string;
  };
  children: ReactNode;
};

function shouldHideBottomNav(pathname: string, locale: Locale) {
  return pathname.includes("/telegram-gate");
}

export function AppShell({ locale, navLabels, children }: AppShellProps) {
  const pathname = usePathname();
  const showBottomNav = !shouldHideBottomNav(pathname, locale);

  useTelegramChromeGuard(pathname, locale);

  return (
    <div className="flex h-full max-h-[100dvh] min-w-0 flex-col overflow-hidden">
      <ScrollableMain>{children}</ScrollableMain>
      {showBottomNav && <BottomNav locale={locale} labels={navLabels} />}
    </div>
  );
}

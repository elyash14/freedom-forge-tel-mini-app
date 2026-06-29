"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  hideBackButton,
  isBackButtonMounted,
} from "@telegram-apps/sdk";
import { Calculator, Home, List, Settings } from "lucide-react";

import { useTelegram } from "@/components/telegram/telegram-provider";
import type { Locale } from "@/i18n/config";
import { hideTelegramMainButton } from "@/lib/telegram/main-button";
import { cn } from "@/lib/utils";

type BottomNavLabels = {
  home: string;
  calculator: string;
  plans: string;
  settings: string;
};

type BottomNavProps = {
  locale: Locale;
  labels: BottomNavLabels;
};

const tabs = [
  { id: "home", href: "/home", icon: Home },
  { id: "calculator", href: "/calculator", icon: Calculator },
  { id: "plans", href: "/plans", icon: List },
  { id: "settings", href: "/settings", icon: Settings },
] as const;

export function BottomNav({ locale, labels }: BottomNavProps) {
  const pathname = usePathname();
  const labelMap = {
    home: labels.home,
    calculator: labels.calculator,
    plans: labels.plans,
    settings: labels.settings,
  };

  function isActive(href: string) {
    const base = `/${locale}${href}`;
    return pathname === base || pathname.startsWith(`${base}/`);
  }

  return (
    <nav
      className="shrink-0 border-t border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-bg-color,var(--background))] pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="mx-auto grid h-16 max-w-2xl grid-cols-4">
        {tabs.map((tab) => {
          const href = `/${locale}${tab.href}`;
          const active = isActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={href}
              aria-label={labelMap[tab.id]}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center justify-center transition-colors",
                active
                  ? "text-[var(--tg-theme-link-color,var(--primary))]"
                  : "text-[var(--tg-theme-hint-color,var(--muted-foreground))]",
              )}
            >
              <Icon className={cn("h-6 w-6", active && "stroke-[2.5]")} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function isPlanDetailPath(pathname: string, locale: Locale) {
  return new RegExp(`^/${locale}/plans/[^/]+$`).test(pathname);
}

export function useTelegramChromeGuard(pathname: string, locale: Locale) {
  const { isTelegram } = useTelegram();

  useEffect(() => {
    if (!isTelegram) return;
    if (isPlanDetailPath(pathname, locale)) return;

    hideTelegramMainButton();

    const interval = window.setInterval(hideTelegramMainButton, 500);
    const timeout = window.setTimeout(() => {
      window.clearInterval(interval);
    }, 3000);

    if (isBackButtonMounted() && hideBackButton.isAvailable()) {
      hideBackButton();
    }

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [isTelegram, locale, pathname]);
}

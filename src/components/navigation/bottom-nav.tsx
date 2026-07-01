"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  hideBackButton,
  isBackButtonMounted,
} from "@telegram-apps/sdk";
import { Calculator, Home, List, Settings, Wallet } from "lucide-react";

import { useTelegram } from "@/components/telegram/telegram-provider";
import type { Locale } from "@/i18n/config";
import { hideTelegramMainButton } from "@/lib/telegram/main-button";
import { cn } from "@/lib/utils";

type BottomNavLabels = {
  home: string;
  calculator: string;
  plans: string;
  externalAssets: string;
  settings: string;
};

type BottomNavProps = {
  locale: Locale;
  labels: BottomNavLabels;
};

const tabs = [
  { id: "calculator", href: "/calculator", icon: Calculator },
  { id: "plans", href: "/plans", icon: List },
  { id: "home", href: "/home", icon: Home, center: true },
  { id: "external-assets", href: "/external-assets", icon: Wallet },
  { id: "settings", href: "/settings", icon: Settings },
] as const;

export function BottomNav({ locale, labels }: BottomNavProps) {
  const pathname = usePathname();
  const labelMap = {
    home: labels.home,
    calculator: labels.calculator,
    plans: labels.plans,
    "external-assets": labels.externalAssets,
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
      <div className="mx-auto grid h-16 max-w-2xl grid-cols-5 items-end">
        {tabs.map((tab) => {
          const href = `/${locale}${tab.href}`;
          const active = isActive(tab.href);
          const Icon = tab.icon;
          const isCenter = "center" in tab && tab.center;

          return (
            <Link
              key={tab.id}
              href={href}
              aria-label={labelMap[tab.id]}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center justify-center transition-colors",
                isCenter ? "pb-1" : "h-full",
                !isCenter &&
                  (active
                    ? "text-[var(--tg-theme-link-color,var(--primary))]"
                    : "text-[var(--tg-theme-hint-color,var(--muted-foreground))]"),
              )}
            >
              {isCenter ? (
                <span
                  className={cn(
                    "flex h-12 w-12 -translate-y-1 items-center justify-center rounded-full shadow-sm transition-colors",
                    active
                      ? "bg-[var(--tg-theme-button-color,var(--primary))] text-[var(--tg-theme-button-text-color,var(--primary-foreground))]"
                      : "bg-[var(--tg-theme-secondary-bg-color,var(--muted))] text-[var(--tg-theme-hint-color,var(--muted-foreground))]",
                  )}
                >
                  <Icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                </span>
              ) : (
                <Icon className={cn("h-6 w-6", active && "stroke-[2.5]")} />
              )}
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

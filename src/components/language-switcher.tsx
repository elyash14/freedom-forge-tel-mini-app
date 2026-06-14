"use client";

import { usePathname, useRouter } from "next/navigation";

import { useTelegram } from "@/components/telegram/telegram-provider";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { locales } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { cn } from "@/lib/utils";

type LanguageSwitcherProps = {
  locale: Locale;
  dictionary: Dictionary;
  className?: string;
};

export function LanguageSwitcher({
  locale,
  dictionary,
  className,
}: LanguageSwitcherProps) {
  const { isTelegram } = useTelegram();
  const pathname = usePathname();
  const router = useRouter();

  if (isTelegram) {
    return null;
  }

  function switchLocale(nextLocale: Locale) {
    document.cookie = `locale=${nextLocale};path=/;max-age=31536000`;

    const segments = pathname.split("/");
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = nextLocale;
    } else {
      segments.splice(1, 0, nextLocale);
    }

    router.push(segments.join("/") || `/${nextLocale}`);
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {dictionary.language.label}:
      </span>
      {locales.map((option) => (
        <Button
          key={option}
          type="button"
          variant={locale === option ? "default" : "outline"}
          className="h-8 px-3 text-xs"
          onClick={() => switchLocale(option)}
        >
          {dictionary.language[option]}
        </Button>
      ))}
    </div>
  );
}

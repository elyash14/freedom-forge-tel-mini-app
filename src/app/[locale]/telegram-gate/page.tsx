import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

type TelegramGatePageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function TelegramGatePage({ params }: TelegramGatePageProps) {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const t = dictionary.telegram;
  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const botLink = botUsername ? `https://t.me/${botUsername}` : null;

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{t.gateTitle}</h1>
        <p className="text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
          {t.gateDescription}
        </p>
      </div>

      {botLink ? (
        <Link
          href={botLink}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--tg-theme-button-color,var(--primary))] px-6 text-sm font-medium text-[var(--tg-theme-button-text-color,var(--primary-foreground))]"
        >
          {t.gateOpenBot}
        </Link>
      ) : (
        <p className="text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
          {t.gateBotNotConfigured}
        </p>
      )}
    </div>
  );
}

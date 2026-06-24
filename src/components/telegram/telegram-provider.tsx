"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  bindMiniAppCssVars,
  init,
  isTMA,
  miniApp,
  mountMiniApp,
  retrieveRawInitData,
  setMiniAppBackgroundColor,
  setMiniAppHeaderColor,
} from "@telegram-apps/sdk";

import type { Locale } from "@/i18n/config";
import { hideTelegramMainButton } from "@/lib/telegram/main-button";

type TelegramContextValue = {
  isTelegram: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
};

const TelegramContext = createContext<TelegramContextValue>({
  isTelegram: false,
  isReady: false,
  isAuthenticated: false,
});

export function useTelegram() {
  return useContext(TelegramContext);
}

type TelegramProviderProps = {
  locale: Locale;
  loadingText?: string;
  children: ReactNode;
};

function getInitData(): string {
  const fromSdk = retrieveRawInitData();
  if (fromSdk) return fromSdk;

  if (typeof window !== "undefined") {
    const tg = (window as Window & { Telegram?: { WebApp?: { initData?: string } } })
      .Telegram;
    return tg?.WebApp?.initData ?? "";
  }

  return "";
}

function isInsideTelegram(): boolean {
  if (isTMA()) return true;
  return getInitData().length > 0;
}

async function mountMiniAppSafely() {
  if (!mountMiniApp.isAvailable()) return;

  await Promise.race([
    mountMiniApp(),
    new Promise<void>((resolve) => {
      setTimeout(resolve, 3000);
    }),
  ]);
}

export function TelegramProvider({
  locale,
  loadingText = "…",
  children,
}: TelegramProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTelegram, setIsTelegram] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const isGatePage = pathname.includes("/telegram-gate");

  const boot = useCallback(async () => {
    if (isGatePage) {
      setIsReady(true);
      return;
    }

    if (!isInsideTelegram()) {
      router.replace(`/${locale}/telegram-gate`);
      return;
    }

    setIsTelegram(true);

    try {
      init();
      await mountMiniAppSafely();

      if (bindMiniAppCssVars.isAvailable()) {
        bindMiniAppCssVars();
      }

      if (miniApp.ready.isAvailable()) {
        miniApp.ready();
      }

      hideTelegramMainButton();

      if (setMiniAppHeaderColor.isAvailable()) {
        setMiniAppHeaderColor("bg_color");
      }

      if (setMiniAppBackgroundColor.isAvailable()) {
        setMiniAppBackgroundColor("bg_color");
      }

      const initData = getInitData();

      if (!initData) {
        router.replace(`/${locale}/telegram-gate`);
        return;
      }

      const authRes = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ initData }),
      });

      if (!authRes.ok) {
        const body = (await authRes.json().catch(() => null)) as {
          error?: string;
        } | null;
        setBootError(body?.error ?? "Authentication failed.");
        setIsReady(true);
        return;
      }

      setIsAuthenticated(true);
      setIsReady(true);
    } catch (error) {
      console.error("Telegram boot failed:", error);
      setBootError("Failed to start the Mini App.");
      setIsReady(true);
    }
  }, [isGatePage, locale, router]);

  useEffect(() => {
    void boot();
  }, [boot]);

  const value = useMemo(
    () => ({ isTelegram, isReady, isAuthenticated }),
    [isTelegram, isReady, isAuthenticated],
  );

  if (!isReady && !isGatePage) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-8 text-sm text-[var(--tg-theme-text-color,var(--foreground))]">
        {loadingText}
      </div>
    );
  }

  if (bootError && !isAuthenticated) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 p-8 text-center text-sm text-[var(--tg-theme-text-color,var(--foreground))]">
        <p>{bootError}</p>
        <button
          type="button"
          className="rounded-xl bg-[var(--tg-theme-button-color,var(--primary))] px-4 py-2 text-[var(--tg-theme-button-text-color,var(--primary-foreground))]"
          onClick={() => {
            setBootError(null);
            setIsReady(false);
            void boot();
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <TelegramContext.Provider value={value}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        {children}
      </div>
    </TelegramContext.Provider>
  );
}

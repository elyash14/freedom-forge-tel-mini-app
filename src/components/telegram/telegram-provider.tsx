"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  isTMA,
  retrieveRawInitData,
} from "@telegram-apps/sdk";

import type { Locale } from "@/i18n/config";
import { isAdminRole } from "@/lib/auth/role-utils";
import { ColorSchemeSync } from "@/components/telegram/color-scheme-sync";
import { AppLoadingScreen } from "@/components/brand/app-loading-screen";
import {
  clearTelegramSessionSnapshot,
  ensureTelegramSdkReady,
  getTelegramSessionSnapshot,
  resetTelegramSdkBootForRetry,
  setTelegramSessionSnapshot,
  type TelegramSessionSnapshot,
} from "@/lib/telegram/boot-state";

type TelegramContextValue = {
  isTelegram: boolean;
  isReady: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

const TelegramContext = createContext<TelegramContextValue>({
  isTelegram: false,
  isReady: false,
  isAuthenticated: false,
  isAdmin: false,
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

async function refreshSessionFromCookie(): Promise<TelegramSessionSnapshot | null> {
  const authRes = await fetch("/api/auth/telegram", {
    credentials: "include",
  });

  if (!authRes.ok) {
    return null;
  }

  const authData = (await authRes.json()) as {
    user?: { role?: string };
  };
  const role =
    typeof authData.user?.role === "string" ? authData.user.role : "";
  const admin = isAdminRole(role);

  return {
    isTelegram: true,
    isAuthenticated: true,
    isAdmin: admin,
  };
}

function applySession(
  snapshot: TelegramSessionSnapshot,
  setters: {
    setIsTelegram: (value: boolean) => void;
    setIsAuthenticated: (value: boolean) => void;
    setIsAdmin: (value: boolean) => void;
    setIsReady: (value: boolean) => void;
    setBootError: (value: string | null) => void;
  },
) {
  setTelegramSessionSnapshot(snapshot);
  setters.setIsTelegram(snapshot.isTelegram);
  setters.setIsAuthenticated(snapshot.isAuthenticated);
  setters.setIsAdmin(snapshot.isAdmin);
  setters.setIsReady(true);
  setters.setBootError(null);
}

function snapshotToState(snapshot: ReturnType<typeof getTelegramSessionSnapshot>) {
  if (!snapshot?.isAuthenticated) {
    return {
      isReady: false,
      isTelegram: false,
      isAuthenticated: false,
      isAdmin: false,
    };
  }

  return {
    isReady: true,
    isTelegram: snapshot.isTelegram,
    isAuthenticated: snapshot.isAuthenticated,
    isAdmin: snapshot.isAdmin,
  };
}

export function TelegramProvider({
  locale,
  loadingText = "…",
  children,
}: TelegramProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const cachedSession = getTelegramSessionSnapshot();
  const cachedState = snapshotToState(cachedSession);

  const [isReady, setIsReady] = useState(cachedState.isReady);
  const [isAuthenticated, setIsAuthenticated] = useState(
    cachedState.isAuthenticated,
  );
  const [isAdmin, setIsAdmin] = useState(cachedState.isAdmin);
  const [isTelegram, setIsTelegram] = useState(
    () =>
      cachedState.isTelegram ||
      (typeof window !== "undefined" && isInsideTelegram()),
  );
  const [bootError, setBootError] = useState<string | null>(null);

  const isGatePage = pathname.includes("/telegram-gate");
  const useTelegramTheme = isTelegram && !isGatePage;

  const boot = useCallback(async () => {
    if (isGatePage) {
      setIsReady(true);
      return;
    }

    if (!isInsideTelegram()) {
      router.replace(`/${localeRef.current}/telegram-gate`);
      return;
    }

    setIsTelegram(true);

    try {
      await ensureTelegramSdkReady();

      const refreshed = await refreshSessionFromCookie();
      if (refreshed) {
        applySession(refreshed, {
          setIsTelegram,
          setIsAuthenticated,
          setIsAdmin,
          setIsReady,
          setBootError,
        });
        return;
      }

      clearTelegramSessionSnapshot();

      const initData = getInitData();

      if (!initData) {
        router.replace(`/${localeRef.current}/telegram-gate`);
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

  const authData = (await authRes.json()) as {
    authenticated?: boolean;
    user?: { role?: string };
  };
  const role =
    typeof authData.user?.role === "string" ? authData.user.role : "";
  const admin = isAdminRole(role);

      applySession(
        {
          isTelegram: true,
          isAuthenticated: true,
          isAdmin: admin,
        },
        {
          setIsTelegram,
          setIsAuthenticated,
          setIsAdmin,
          setIsReady,
          setBootError,
        },
      );
    } catch (error) {
      console.error("Telegram boot failed:", error);
      setBootError("Failed to start the Mini App.");
      setIsReady(true);
    }
  }, [isGatePage, router]);

  useEffect(() => {
    void boot();
  }, [boot]);

  const value = useMemo(
    () => ({ isTelegram, isReady, isAuthenticated, isAdmin }),
    [isTelegram, isReady, isAuthenticated, isAdmin],
  );

  if (!isReady && !isGatePage) {
    return (
      <>
        <ColorSchemeSync useTelegramTheme={useTelegramTheme} />
        <AppLoadingScreen loadingText={loadingText} />
      </>
    );
  }

  if (bootError && !isAuthenticated) {
    return (
      <>
        <ColorSchemeSync useTelegramTheme={useTelegramTheme} />
        <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 p-8 text-center text-sm text-[var(--tg-theme-text-color,var(--foreground))]">
          <p>{bootError}</p>
          <button
            type="button"
            className="rounded-xl bg-[var(--tg-theme-button-color,var(--primary))] px-4 py-2 text-[var(--tg-theme-button-text-color,var(--primary-foreground))]"
            onClick={() => {
              resetTelegramSdkBootForRetry();
              clearTelegramSessionSnapshot();
              setBootError(null);
              setIsReady(false);
              setIsAuthenticated(false);
              setIsAdmin(false);
              void boot();
            }}
          >
            Retry
          </button>
        </div>
      </>
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

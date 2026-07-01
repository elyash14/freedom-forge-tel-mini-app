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

import { ColorSchemeSync } from "@/components/telegram/color-scheme-sync";
import { useTelegram } from "@/components/telegram/telegram-provider";
import {
  getStoredAppTheme,
  setStoredAppTheme,
  type AppTheme,
} from "@/lib/app-preferences";

type AppPreferencesContextValue = {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue>({
  theme: "telegram",
  setTheme: () => undefined,
});

export function useAppPreferences() {
  return useContext(AppPreferencesContext);
}

type AppPreferencesProviderProps = {
  children: ReactNode;
};

export function AppPreferencesProvider({ children }: AppPreferencesProviderProps) {
  const { isTelegram } = useTelegram();
  const [theme, setThemeState] = useState<AppTheme>("telegram");

  useEffect(() => {
    setThemeState(getStoredAppTheme());
  }, []);

  const setTheme = useCallback((next: AppTheme) => {
    setStoredAppTheme(next);
    setThemeState(next);
  }, []);

  const useTelegramTheme =
    theme === "telegram" && isTelegram
      ? true
      : theme === "system";

  const forceDark =
    theme === "dark" ? true : theme === "light" ? false : undefined;

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <AppPreferencesContext.Provider value={value}>
      <ColorSchemeSync
        useTelegramTheme={useTelegramTheme}
        forceDark={forceDark}
      />
      {children}
    </AppPreferencesContext.Provider>
  );
}

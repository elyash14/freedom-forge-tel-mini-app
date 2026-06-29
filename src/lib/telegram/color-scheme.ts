import {
  isThemeParamsDark,
  isThemeParamsMounted,
  on,
} from "@telegram-apps/sdk";

type TelegramWebApp = {
  colorScheme?: "light" | "dark";
  onEvent?: (event: string, callback: () => void) => void;
  offEvent?: (event: string, callback: () => void) => void;
};

function getTelegramWebApp(): TelegramWebApp | undefined {
  if (typeof window === "undefined") return undefined;
  return (
    window as Window & { Telegram?: { WebApp?: TelegramWebApp } }
  ).Telegram?.WebApp;
}

export function applyDocumentColorScheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
}

function readTelegramColorSchemeDark(): boolean | null {
  if (isThemeParamsMounted()) {
    return isThemeParamsDark();
  }

  const colorScheme = getTelegramWebApp()?.colorScheme;
  if (colorScheme) {
    return colorScheme === "dark";
  }

  return null;
}

export function subscribeTelegramColorScheme(
  onChange: (isDark: boolean) => void,
): () => void {
  const sync = () => {
    const isDark = readTelegramColorSchemeDark();
    if (isDark !== null) {
      onChange(isDark);
    }
  };

  sync();

  const cleanups: Array<() => void> = [];

  cleanups.push(isThemeParamsDark.sub(() => sync()));
  cleanups.push(on("theme_changed", sync));

  const webApp = getTelegramWebApp();
  if (webApp?.onEvent) {
    webApp.onEvent("themeChanged", sync);
    cleanups.push(() => webApp.offEvent?.("themeChanged", sync));
  }

  return () => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
}

export function subscribeSystemColorScheme(
  onChange: (isDark: boolean) => void,
): () => void {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const sync = () => onChange(mediaQuery.matches);

  sync();
  mediaQuery.addEventListener("change", sync);

  return () => mediaQuery.removeEventListener("change", sync);
}

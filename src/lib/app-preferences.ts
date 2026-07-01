export const APP_THEME_STORAGE_KEY = "app-theme";

export const APP_THEMES = ["telegram", "light", "dark", "system"] as const;
export type AppTheme = (typeof APP_THEMES)[number];

export function isAppTheme(value: string): value is AppTheme {
  return APP_THEMES.includes(value as AppTheme);
}

export function getStoredAppTheme(): AppTheme {
  if (typeof window === "undefined") {
    return "telegram";
  }

  const stored = localStorage.getItem(APP_THEME_STORAGE_KEY);
  if (stored && isAppTheme(stored)) {
    return stored;
  }

  return "telegram";
}

export function setStoredAppTheme(theme: AppTheme): void {
  localStorage.setItem(APP_THEME_STORAGE_KEY, theme);
}

export const LOCALE_COOKIE = "locale";

export function setLocaleCookie(locale: string): void {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

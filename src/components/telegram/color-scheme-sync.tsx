"use client";

import { useEffect } from "react";

import {
  applyDocumentColorScheme,
  subscribeSystemColorScheme,
  subscribeTelegramColorScheme,
} from "@/lib/telegram/color-scheme";

type ColorSchemeSyncProps = {
  useTelegramTheme: boolean;
  forceDark?: boolean;
};

export function ColorSchemeSync({
  useTelegramTheme,
  forceDark,
}: ColorSchemeSyncProps) {
  useEffect(() => {
    if (forceDark !== undefined) {
      applyDocumentColorScheme(forceDark);
      return;
    }

    const subscribe = useTelegramTheme
      ? subscribeTelegramColorScheme
      : subscribeSystemColorScheme;

    return subscribe(applyDocumentColorScheme);
  }, [useTelegramTheme, forceDark]);

  return null;
}

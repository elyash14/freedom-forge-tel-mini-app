"use client";

import { useEffect } from "react";

import {
  applyDocumentColorScheme,
  subscribeSystemColorScheme,
  subscribeTelegramColorScheme,
} from "@/lib/telegram/color-scheme";

type ColorSchemeSyncProps = {
  useTelegramTheme: boolean;
};

export function ColorSchemeSync({ useTelegramTheme }: ColorSchemeSyncProps) {
  useEffect(() => {
    const subscribe = useTelegramTheme
      ? subscribeTelegramColorScheme
      : subscribeSystemColorScheme;

    return subscribe(applyDocumentColorScheme);
  }, [useTelegramTheme]);

  return null;
}

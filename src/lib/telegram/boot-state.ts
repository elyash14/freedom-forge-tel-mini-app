import {
  bindMiniAppCssVars,
  init,
  miniApp,
  mountMiniApp,
  setMiniAppBackgroundColor,
  setMiniAppHeaderColor,
} from "@telegram-apps/sdk";

import { hideTelegramMainButton } from "@/lib/telegram/main-button";

export type TelegramSessionSnapshot = {
  isTelegram: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

let sdkInitialized = false;
let sessionSnapshot: TelegramSessionSnapshot | null = null;

export function getTelegramSessionSnapshot(): TelegramSessionSnapshot | null {
  return sessionSnapshot;
}

export function setTelegramSessionSnapshot(snapshot: TelegramSessionSnapshot) {
  sessionSnapshot = snapshot;
}

export function clearTelegramSessionSnapshot() {
  sessionSnapshot = null;
}

async function mountMiniAppSafely() {
  if (!mountMiniApp.isAvailable()) {
    return;
  }

  await Promise.race([
    mountMiniApp(),
    new Promise<void>((resolve) => {
      setTimeout(resolve, 3000);
    }),
  ]);
}

function isCssVarsAlreadyBoundError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "CSSVarsBoundError" ||
      error.message.includes("CSS variables are already bound"))
  );
}

export async function ensureTelegramSdkReady() {
  if (sdkInitialized) {
    hideTelegramMainButton();

    if (setMiniAppHeaderColor.isAvailable()) {
      setMiniAppHeaderColor("bg_color");
    }

    if (setMiniAppBackgroundColor.isAvailable()) {
      setMiniAppBackgroundColor("bg_color");
    }

    return;
  }

  init();
  await mountMiniAppSafely();

  if (bindMiniAppCssVars.isAvailable()) {
    try {
      bindMiniAppCssVars();
    } catch (error) {
      if (!isCssVarsAlreadyBoundError(error)) {
        throw error;
      }
    }
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

  sdkInitialized = true;
}

export function resetTelegramSdkBootForRetry() {
  sdkInitialized = false;
  sessionSnapshot = null;
}

"use client";

import { useEffect, useRef } from "react";
import {
  isMainButtonMounted,
  mountMainButton,
  offMainButtonClick,
  onMainButtonClick,
  unmountMainButton,
} from "@telegram-apps/sdk";

import {
  hideTelegramMainButton,
  showTelegramMainButton,
} from "@/lib/telegram/main-button";
import { useTelegram } from "@/components/telegram/telegram-provider";

type UseTelegramMainButtonOptions = {
  visible: boolean;
  text: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

export function useTelegramMainButton({
  visible,
  text,
  disabled = false,
  loading = false,
  onClick,
}: UseTelegramMainButtonOptions) {
  const { isTelegram } = useTelegram();
  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    if (!isTelegram) return;

    if (!visible) {
      hideTelegramMainButton();
      return;
    }

    if (!isMainButtonMounted() && mountMainButton.isAvailable()) {
      mountMainButton();
    }

    const handler = () => {
      onClickRef.current();
    };

    showTelegramMainButton({
      text,
      disabled,
      loading,
      onClick: handler,
    });

    const off = onMainButtonClick(handler);

    return () => {
      off();
      offMainButtonClick(handler);
      hideTelegramMainButton();
    };
  }, [isTelegram, visible, text, disabled, loading]);
}

export { hideTelegramMainButton } from "@/lib/telegram/main-button";

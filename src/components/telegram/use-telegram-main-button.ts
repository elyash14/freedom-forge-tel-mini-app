"use client";

import { useEffect, useRef } from "react";
import {
  isMainButtonMounted,
  mountMainButton,
  offMainButtonClick,
  onMainButtonClick,
  setMainButtonParams,
  unmountMainButton,
} from "@telegram-apps/sdk";

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
      if (isMainButtonMounted() && setMainButtonParams.isAvailable()) {
        setMainButtonParams({ isVisible: false });
      }
      return;
    }

    if (!isMainButtonMounted() && mountMainButton.isAvailable()) {
      mountMainButton();
    }

    if (setMainButtonParams.isAvailable()) {
      setMainButtonParams({
        text,
        isEnabled: !disabled,
        isVisible: true,
        isLoaderVisible: loading,
      });
    }

    const handler = () => {
      onClickRef.current();
    };

    const off = onMainButtonClick(handler);

    return () => {
      off();
      offMainButtonClick(handler);
    };
  }, [isTelegram, visible, text, disabled, loading]);

  useEffect(() => {
    return () => {
      if (isTelegram && isMainButtonMounted()) {
        unmountMainButton();
      }
    };
  }, [isTelegram]);
}

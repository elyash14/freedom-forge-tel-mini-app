"use client";

import { useEffect, useRef } from "react";
import {
  hideBackButton,
  isBackButtonMounted,
  mountBackButton,
  offBackButtonClick,
  onBackButtonClick,
  showBackButton,
  unmountBackButton,
} from "@telegram-apps/sdk";

import { useTelegram } from "@/components/telegram/telegram-provider";

type UseTelegramBackButtonOptions = {
  visible: boolean;
  onClick: () => void;
};

export function useTelegramBackButton({
  visible,
  onClick,
}: UseTelegramBackButtonOptions) {
  const { isTelegram } = useTelegram();
  const onClickRef = useRef(onClick);

  useEffect(() => {
    onClickRef.current = onClick;
  }, [onClick]);

  useEffect(() => {
    if (!isTelegram || !visible) {
      if (isTelegram && isBackButtonMounted() && hideBackButton.isAvailable()) {
        hideBackButton();
      }
      return;
    }

    if (!isBackButtonMounted() && mountBackButton.isAvailable()) {
      mountBackButton();
    }

    if (showBackButton.isAvailable()) {
      showBackButton();
    }

    const handler = () => {
      onClickRef.current();
    };

    const off = onBackButtonClick(handler);

    return () => {
      off();
      offBackButtonClick(handler);
      if (hideBackButton.isAvailable()) {
        hideBackButton();
      }
    };
  }, [isTelegram, visible]);

  useEffect(() => {
    return () => {
      if (isTelegram && isBackButtonMounted()) {
        unmountBackButton();
      }
    };
  }, [isTelegram]);
}

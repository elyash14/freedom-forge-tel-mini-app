import {
  isMainButtonMounted,
  setMainButtonParams,
  unmountMainButton,
} from "@telegram-apps/sdk";

type TelegramWebApp = {
  MainButton?: {
    hide: () => void;
    show: () => void;
    enable: () => void;
    disable: () => void;
    setText: (text: string) => void;
    onClick: (handler: () => void) => void;
    offClick: (handler: () => void) => void;
    showProgress: (leaveActive?: boolean) => void;
    hideProgress: () => void;
    isVisible: boolean;
  };
};

function getWebApp(): TelegramWebApp | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { Telegram?: { WebApp?: TelegramWebApp } })
    .Telegram?.WebApp;
}

export function hideTelegramMainButton() {
  const webApp = getWebApp();
  const mainButton = webApp?.MainButton;

  if (mainButton && legacyMainButtonHandler) {
    mainButton.offClick(legacyMainButtonHandler);
    legacyMainButtonHandler = null;
  }

  mainButton?.hide();

  if (isMainButtonMounted()) {
    if (setMainButtonParams.isAvailable()) {
      setMainButtonParams({ isVisible: false });
    }
    unmountMainButton();
  }
}

let legacyMainButtonHandler: (() => void) | null = null;

export function showTelegramMainButton(options: {
  text: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  const webApp = getWebApp();
  const mainButton = webApp?.MainButton;

  if (mainButton) {
    if (legacyMainButtonHandler) {
      mainButton.offClick(legacyMainButtonHandler);
    }

    legacyMainButtonHandler = options.onClick;
    mainButton.setText(options.text);
    mainButton.onClick(options.onClick);

    if (options.loading) {
      mainButton.showProgress();
    } else {
      mainButton.hideProgress();
    }

    if (options.disabled) {
      mainButton.disable();
    } else {
      mainButton.enable();
    }

    mainButton.show();
    return;
  }

  if (!isMainButtonMounted()) return;

  if (setMainButtonParams.isAvailable()) {
    setMainButtonParams({
      text: options.text,
      isEnabled: !options.disabled,
      isVisible: true,
      isLoaderVisible: options.loading ?? false,
    });
  }
}

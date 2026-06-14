import { parse, validate } from "@telegram-apps/init-data-node";

import { getTelegramBotToken } from "@/lib/telegram/config";

export type ParsedTelegramUser = {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
};

export function validateAndParseInitData(initData: string) {
  const botToken = getTelegramBotToken();
  validate(initData, botToken, { expiresIn: 86400 });
  const parsed = parse(initData);

  if (!parsed.user?.id) {
    throw new Error("Telegram user is missing from init data.");
  }

  const user: ParsedTelegramUser = {
    id: parsed.user.id,
    username: parsed.user.username,
    firstName: parsed.user.first_name,
    lastName: parsed.user.last_name,
    languageCode: parsed.user.language_code,
  };

  return { user, parsed };
}

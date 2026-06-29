import { Bot, InlineKeyboard } from "grammy";

import { getTelegramBotToken, getWebAppUrl } from "@/lib/telegram/config";

let botInstance: Bot | null = null;

export function getTelegramBot(): Bot {
  if (!botInstance) {
    botInstance = new Bot(getTelegramBotToken());

    botInstance.command("start", async (ctx) => {
      const webAppUrl = `${getWebAppUrl().replace(/\/$/, "")}/fa/home`;
      const keyboard = new InlineKeyboard().webApp("باز کردن اپ", webAppUrl);

      await ctx.reply(
        "برای شروع، اپ مینی را باز کنید:",
        { reply_markup: keyboard },
      );
    });
  }

  return botInstance;
}

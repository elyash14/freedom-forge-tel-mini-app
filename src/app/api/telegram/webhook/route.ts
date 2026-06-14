import { webhookCallback } from "grammy";

import { getTelegramBot } from "@/lib/telegram/bot";

export async function POST(request: Request) {
  try {
    const bot = getTelegramBot();
    const handler = webhookCallback(bot, "std/http");
    return handler(request);
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return new Response("Webhook not configured.", { status: 500 });
  }
}

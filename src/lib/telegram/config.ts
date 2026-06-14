export function getTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set.");
  }
  return token;
}

export function getWebAppUrl(): string {
  return process.env.WEBAPP_URL ?? "http://localhost:3077";
}

export function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ??
    process.env.TELEGRAM_BOT_TOKEN ??
    "dev-session-secret"
  );
}

export const TG_SESSION_COOKIE = "tg_session";
export const TG_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

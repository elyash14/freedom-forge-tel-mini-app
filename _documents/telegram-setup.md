# Telegram Mini App Setup

## 1. Create the bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. Send `/newbot` and follow the prompts.
3. Copy the bot token into `.env` as `TELEGRAM_BOT_TOKEN`.
4. Set `TELEGRAM_BOT_USERNAME` (without `@`).

## 2. Local dev with ngrok

```bash
pnpm dev:tunnel
```

Or run separately:

```bash
pnpm dev          # http://localhost:3077
ngrok http 3077   # copy the https URL
```

Update `.env`:

```env
WEBAPP_URL=https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app
```

Restart `pnpm dev` after changing `WEBAPP_URL` — Next.js reads the ngrok host for `allowedDevOrigins` so client JavaScript loads inside Telegram.

## 3. Configure BotFather

1. `/setdomain` → enter ngrok host only (e.g. `xxxx.ngrok-free.app`).
2. Bot Settings → **Menu Button** → Configure Mini App → URL:
   `https://YOUR-NGROK-SUBDOMAIN.ngrok-free.app/fa`
3. (Optional) `/newapp` to get a direct link: `https://t.me/<bot_username>/<short_name>`

## 4. Register webhook (for /start button)

After ngrok is running:

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook?url=<WEBAPP_URL>/api/telegram/webhook"
```

Send `/start` to your bot to get an inline **Open App** button (useful in groups).

## 5. Test

1. Open the bot in Telegram (mobile or desktop).
2. Tap the menu button or `/start` → Open App.
3. Do **not** test by opening the ngrok URL directly in a browser — the app requires Telegram `initData`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| ngrok URL changed | Update `WEBAPP_URL`, BotFather domain, Menu Button URL, and webhook |
| Invalid init data | Check `TELEGRAM_BOT_TOKEN` matches the bot that opened the Mini App |
| Webhook not working | Re-run `setWebhook`; ensure ngrok tunnel is active |
| Blank screen / stuck on loading | Restart `pnpm dev` after updating `WEBAPP_URL`; check dev console for blocked `/_next/` requests |

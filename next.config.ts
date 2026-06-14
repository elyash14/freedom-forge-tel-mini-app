import type { NextConfig } from "next";

function getNgrokDevOrigin(): string | undefined {
  const webAppUrl = process.env.WEBAPP_URL;
  if (!webAppUrl) return undefined;

  try {
    return new URL(webAppUrl).hostname;
  } catch {
    return undefined;
  }
}

const ngrokOrigin = getNgrokDevOrigin();

const nextConfig: NextConfig = {
  // Required for Telegram Mini App testing via ngrok in `next dev`.
  // Without this, client JS chunks are blocked and the app stays on SSR loading.
  ...(ngrokOrigin ? { allowedDevOrigins: [ngrokOrigin] } : {}),
};

export default nextConfig;

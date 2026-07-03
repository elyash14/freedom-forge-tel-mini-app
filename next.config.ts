import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Required for Telegram Mini App testing via ngrok in `next dev`.
  // Without this, client JS chunks are blocked and the app stays on SSR loading.
  allowedDevOrigins: ["*.ngrok-free.app"],
};

export default nextConfig;

import Image from "next/image";

import { cn } from "@/lib/utils";

export const APP_LOGO_PATH = "/app-logo.png";

const sizes = {
  xs: 24,
  sm: 28,
  md: 40,
  lg: 72,
  xl: 112,
} as const;

type AppLogoSize = keyof typeof sizes;

type AppLogoProps = {
  size?: AppLogoSize;
  animated?: boolean;
  className?: string;
  priority?: boolean;
};

export function AppLogo({
  size = "md",
  animated = false,
  className,
  priority = false,
}: AppLogoProps) {
  const dimension = sizes[size];

  return (
    <Image
      src={APP_LOGO_PATH}
      alt=""
      width={dimension}
      height={dimension}
      priority={priority}
      className={cn(
        "object-contain",
        animated && "animate-logo-breathe",
        className,
      )}
    />
  );
}

import * as React from "react";

import { cn } from "@/lib/utils";

function Button({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"button"> & {
  variant?: "default" | "outline";
}) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-300",
        variant === "default" &&
          "bg-[var(--tg-theme-button-color,var(--primary))] text-[var(--tg-theme-button-text-color,var(--primary-foreground))] hover:opacity-90",
        variant === "outline" &&
          "border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-section-bg-color,var(--card))] text-[var(--tg-theme-text-color,var(--foreground))] hover:opacity-90",
        className,
      )}
      {...props}
    />
  );
}

export { Button };

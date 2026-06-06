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
          "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200",
        variant === "outline" &&
          "border border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900",
        className,
      )}
      {...props}
    />
  );
}

export { Button };

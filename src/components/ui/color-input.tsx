"use client";

import { cn } from "@/lib/utils";

type ColorInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function ColorInput({
  value,
  onChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: ColorInputProps) {
  return (
    <input
      type="color"
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      className={cn(
        "h-10 w-14 shrink-0 cursor-pointer rounded-lg border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    />
  );
}

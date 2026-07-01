"use client";

import { cn } from "@/lib/utils";

type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentControlProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: SegmentOption<T>[];
  ariaLabel: string;
};

export function SegmentControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: SegmentControlProps<T>) {
  return (
    <div
      className="grid gap-1.5 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,var(--muted))] p-1.5"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-xl px-3 py-2.5 text-center text-xs font-medium transition-all sm:text-sm",
              isActive
                ? "bg-[var(--tg-theme-section-bg-color,var(--card))] text-[var(--tg-theme-text-color,var(--foreground))] shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                : "text-[var(--tg-theme-hint-color,var(--muted-foreground))] hover:text-[var(--tg-theme-text-color,var(--foreground))]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

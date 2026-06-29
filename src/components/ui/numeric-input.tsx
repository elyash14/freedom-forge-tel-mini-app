"use client";

import { useMemo, type ComponentProps } from "react";

import { Input } from "@/components/ui/input";
import type { Locale } from "@/i18n/config";
import {
  formatInteger,
  formatPercent,
  formatTomanCompact,
} from "@/lib/freedom-format";
import {
  parseLocalizedNumber,
  sanitizeDecimalInput,
  sanitizeIntegerInput,
} from "@/lib/numeric-input";
import { cn } from "@/lib/utils";

type NumericInputKind = "money" | "integer" | "decimal" | "percent";

type NumericInputProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
  kind?: NumericInputKind;
  unitLabel?: string;
};

function sanitizeByKind(raw: string, kind: NumericInputKind): string {
  if (kind === "decimal" || kind === "percent") {
    return sanitizeDecimalInput(raw);
  }

  return sanitizeIntegerInput(raw);
}

function formatHint(
  value: string,
  kind: NumericInputKind,
  locale: Locale,
  unitLabel?: string,
): string | null {
  const parsed = parseLocalizedNumber(value);

  if (parsed == null) {
    return null;
  }

  if (kind === "percent") {
    return formatPercent(parsed / 100, locale);
  }

  if (kind === "money") {
    const formatted = formatTomanCompact(parsed, locale);
    return unitLabel ? `${formatted} ${unitLabel}` : formatted;
  }

  if (kind === "integer") {
    return formatInteger(Math.round(parsed), locale);
  }

  return formatInteger(Math.round(parsed * 100) / 100, locale);
}

export function NumericInput({
  value,
  onChange,
  locale,
  kind = "money",
  unitLabel,
  className,
  onBlur,
  ...props
}: NumericInputProps) {
  const hint = useMemo(
    () => formatHint(value, kind, locale, unitLabel),
    [value, kind, locale, unitLabel],
  );

  return (
    <div className="space-y-1">
      <Input
        {...props}
        type="text"
        dir="ltr"
        inputMode={kind === "decimal" || kind === "percent" ? "decimal" : "numeric"}
        className={cn("tabular-nums", className)}
        value={value}
        onChange={(event) => onChange(sanitizeByKind(event.target.value, kind))}
        onBlur={(event) => {
          onBlur?.(event);
        }}
      />
      {hint ? (
        <p className="text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))] tabular-nums">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

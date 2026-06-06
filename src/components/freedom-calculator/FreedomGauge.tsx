import {
  formatUsd,
  type FreedomResult,
} from "@/lib/freedom-calculator";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { cn } from "@/lib/utils";

type FreedomGaugeProps = {
  result: FreedomResult | null;
  locale: Locale;
  dictionary: Dictionary;
  className?: string;
};

export function FreedomGauge({
  result,
  locale,
  dictionary,
  className,
}: FreedomGaugeProps) {
  const freedomLineUsd = result?.freedomLineUsd ?? 0;
  const gaugeProgress = result
    ? Math.min(100, Math.max(8, (freedomLineUsd / 1_000_000) * 100))
    : 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-zinc-100 p-6 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950",
        className,
      )}
    >
      <div className="mb-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {dictionary.gauge.title}
        </p>
        <p className="mt-2 text-4xl font-bold tabular-nums text-zinc-950 dark:text-zinc-50 sm:text-5xl">
          {result ? formatUsd(freedomLineUsd, locale) : "—"}
        </p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {dictionary.gauge.subtitle}
        </p>
      </div>

      <div className="mx-auto h-3 w-full max-w-md overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
          style={{ width: `${gaugeProgress}%` }}
        />
      </div>

      {result && (
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-white/70 p-3 dark:bg-zinc-900/70">
            <dt className="text-zinc-500 dark:text-zinc-400">
              {dictionary.gauge.monthlyUsd}
            </dt>
            <dd className="mt-1 font-semibold tabular-nums">
              {formatUsd(result.monthlyExpensesUsd, locale)}
            </dd>
          </div>
          <div className="rounded-lg bg-white/70 p-3 dark:bg-zinc-900/70">
            <dt className="text-zinc-500 dark:text-zinc-400">
              {dictionary.gauge.annualUsd}
            </dt>
            <dd className="mt-1 font-semibold tabular-nums">
              {formatUsd(result.annualExpensesUsd, locale)}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}

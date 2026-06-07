import {
  formatUsd,
  formatYears,
  type FreedomResult,
  type PathMode,
} from "@/lib/freedom-calculator";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { cn } from "@/lib/utils";

type FreedomGaugeProps = {
  result: FreedomResult | null;
  pathMode: PathMode;
  locale: Locale;
  dictionary: Dictionary;
  className?: string;
};

export function FreedomGauge({
  result,
  pathMode,
  locale,
  dictionary,
  className,
}: FreedomGaugeProps) {
  const freedomLineUsd = result?.freedomLineUsd ?? 0;
  const gaugeProgress = result
    ? Math.min(100, Math.max(8, (freedomLineUsd / 1_000_000) * 100))
    : 0;

  const alreadyFree =
    result != null &&
    result.monthlyInvestmentUsd != null &&
    result.monthlyInvestmentUsd === 0;

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
        <p
          dir="ltr"
          className="mt-2 text-4xl font-bold tabular-nums text-zinc-950 dark:text-zinc-50 sm:text-5xl"
        >
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
            <dd dir="ltr" className="mt-1 font-semibold tabular-nums">
              {formatUsd(result.monthlyExpensesUsd, locale)}
            </dd>
          </div>
          <div className="rounded-lg bg-white/70 p-3 dark:bg-zinc-900/70">
            <dt className="text-zinc-500 dark:text-zinc-400">
              {dictionary.gauge.annualUsd}
            </dt>
            <dd dir="ltr" className="mt-1 font-semibold tabular-nums">
              {formatUsd(result.annualExpensesUsd, locale)}
            </dd>
          </div>

          {alreadyFree ? (
            <div className="col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/50">
              <dd className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                {dictionary.gauge.alreadyFree}
              </dd>
            </div>
          ) : pathMode === "yearsToInvest" &&
            result.monthlyInvestmentUsd != null ? (
            <div className="col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/50">
              <dt className="text-sm text-emerald-700 dark:text-emerald-300">
                {dictionary.gauge.monthlyInvestment}
              </dt>
              <dd
                dir="ltr"
                className="mt-1 text-xl font-bold tabular-nums text-emerald-900 dark:text-emerald-100"
              >
                {formatUsd(result.monthlyInvestmentUsd, locale)}
              </dd>
            </div>
          ) : pathMode === "monthlyToYears" &&
            result.yearsToFreedom != null ? (
            <div className="col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/50">
              <dt className="text-sm text-emerald-700 dark:text-emerald-300">
                {dictionary.gauge.yearsToFreedom}
              </dt>
              <dd className="mt-1 text-xl font-bold text-emerald-900 dark:text-emerald-100">
                <span dir="ltr" className="tabular-nums">
                  {formatYears(result.yearsToFreedom, locale)}
                </span>{" "}
                <span>{dictionary.gauge.yearsUnit}</span>
              </dd>
            </div>
          ) : null}
        </dl>
      )}
    </div>
  );
}

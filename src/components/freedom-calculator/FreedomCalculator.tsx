"use client";

import { useEffect, useMemo, useState } from "react";

import { FreedomGauge } from "@/components/freedom-calculator/FreedomGauge";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import {
  calculateFreedomLine,
  formatPercent,
  formatToman,
  type PathMode,
  validateFreedomInputs,
} from "@/lib/freedom-calculator";
import { cn } from "@/lib/utils";

type AppConfigResponse = {
  defaultInvestmentReturnRate: number;
};

type ExchangeRateResponse = {
  rate: number;
  source: "live" | "fallback";
};

type FreedomCalculatorProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function FreedomCalculator({
  locale,
  dictionary,
}: FreedomCalculatorProps) {
  const [monthlyExpenses, setMonthlyExpenses] = useState("");
  const [usdTomanRate, setUsdTomanRate] = useState("");
  const [investmentReturnRate, setInvestmentReturnRate] = useState(0.25);
  const [currentSavingsUsd, setCurrentSavingsUsd] = useState("0");
  const [pathMode, setPathMode] = useState<PathMode>("yearsToInvest");
  const [yearsToFreedom, setYearsToFreedom] = useState("10");
  const [monthlyInvestmentUsd, setMonthlyInvestmentUsd] = useState("500");
  const [rateSource, setRateSource] = useState<"live" | "fallback" | "manual">(
    "manual",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDefaults() {
      try {
        const [configResponse, rateResponse] = await Promise.all([
          fetch("/api/config"),
          fetch("/api/exchange-rate"),
        ]);

        if (!configResponse.ok || !rateResponse.ok) {
          throw new Error("Failed to load defaults.");
        }

        const config = (await configResponse.json()) as AppConfigResponse;
        const rate = (await rateResponse.json()) as ExchangeRateResponse;

        setInvestmentReturnRate(config.defaultInvestmentReturnRate);
        setUsdTomanRate(String(rate.rate));
        setRateSource(rate.source);
      } catch {
        setLoadError(dictionary.calculator.loadError);
        setUsdTomanRate("90000");
        setInvestmentReturnRate(0.25);
      } finally {
        setIsLoading(false);
      }
    }

    void loadDefaults();
  }, [dictionary.calculator.loadError]);

  const parsedInputs = useMemo(
    () => ({
      monthlyExpensesToman: Number(monthlyExpenses),
      usdTomanRate: Number(usdTomanRate),
      investmentReturnRate,
      currentSavingsUsd: Number(currentSavingsUsd) || 0,
      mode: pathMode,
      yearsToFreedom: Number(yearsToFreedom),
      monthlyInvestmentUsd: Number(monthlyInvestmentUsd),
    }),
    [
      monthlyExpenses,
      usdTomanRate,
      investmentReturnRate,
      currentSavingsUsd,
      pathMode,
      yearsToFreedom,
      monthlyInvestmentUsd,
    ],
  );

  const validation = useMemo(
    () => validateFreedomInputs(parsedInputs),
    [parsedInputs],
  );

  const result = useMemo(() => {
    if (!monthlyExpenses) {
      return null;
    }

    return calculateFreedomLine(parsedInputs);
  }, [monthlyExpenses, parsedInputs]);

  const pathUnreachable =
    monthlyExpenses &&
    validation.isValid &&
    pathMode === "monthlyToYears" &&
    result === null;

  async function refreshRate() {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch("/api/exchange-rate");
      if (!response.ok) {
        throw new Error("Failed to refresh rate.");
      }

      const rate = (await response.json()) as ExchangeRateResponse;
      setUsdTomanRate(String(rate.rate));
      setRateSource(rate.source);
    } catch {
      setLoadError(dictionary.calculator.refreshError);
    } finally {
      setIsLoading(false);
    }
  }

  const rateSourceLabel =
    rateSource === "live"
      ? dictionary.calculator.rateSourceLive
      : rateSource === "fallback"
        ? dictionary.calculator.rateSourceFallback
        : dictionary.calculator.rateSourceManual;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 text-center sm:text-start">
            <h1 className="text-3xl font-bold tracking-tight">
              {dictionary.calculator.title}
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              {dictionary.calculator.subtitle}
            </p>
          </div>
          <LanguageSwitcher
            locale={locale}
            dictionary={dictionary}
            className="justify-center sm:justify-end"
          />
        </div>
      </header>

      <FreedomGauge
        result={result}
        pathMode={pathMode}
        locale={locale}
        dictionary={dictionary}
      />

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.calculator.cardTitle}</CardTitle>
          <CardDescription>{dictionary.calculator.cardDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadError && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
              {loadError}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="monthly-expenses">
              {dictionary.calculator.monthlyExpenses}
            </Label>
            <Input
              id="monthly-expenses"
              inputMode="numeric"
              placeholder={dictionary.calculator.monthlyExpensesPlaceholder}
              value={monthlyExpenses}
              onChange={(event) => setMonthlyExpenses(event.target.value)}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {dictionary.calculator.monthlyExpensesHint}
            </p>
            {monthlyExpenses && (
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {formatToman(Number(monthlyExpenses), locale)}{" "}
                {dictionary.calculator.toman}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="usd-rate">
                {dictionary.calculator.usdTomanRate}
              </Label>
              <Button
                type="button"
                variant="outline"
                className="h-8 px-3 text-xs"
                onClick={() => void refreshRate()}
                disabled={isLoading}
              >
                {dictionary.calculator.refresh}
              </Button>
            </div>
            <Input
              id="usd-rate"
              inputMode="numeric"
              value={usdTomanRate}
              onChange={(event) => {
                setUsdTomanRate(event.target.value);
                setRateSource("manual");
              }}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {dictionary.calculator.usdTomanHint}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {dictionary.calculator.rateSource}: {rateSourceLabel}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="investment-return">
                {dictionary.calculator.investmentReturnRate}
              </Label>
              <span className="text-sm font-medium tabular-nums">
                {formatPercent(investmentReturnRate, locale)}
              </span>
            </div>
            <Slider
              id="investment-return"
              min={0.05}
              max={1}
              step={0.01}
              value={[investmentReturnRate]}
              onValueChange={(value) =>
                setInvestmentReturnRate(value[0] ?? 0.25)
              }
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {dictionary.calculator.investmentReturnHint}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current-savings">
              {dictionary.calculator.currentSavingsUsd}
            </Label>
            <Input
              id="current-savings"
              inputMode="decimal"
              value={currentSavingsUsd}
              onChange={(event) => setCurrentSavingsUsd(event.target.value)}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {dictionary.calculator.currentSavingsHint}
            </p>
          </div>

          <div className="space-y-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <p className="text-sm font-semibold">
              {dictionary.calculator.pathTitle}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPathMode("yearsToInvest")}
                className={cn(
                  "rounded-lg border p-4 text-start transition-colors",
                  pathMode === "yearsToInvest"
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900",
                )}
              >
                <p className="font-medium">{dictionary.calculator.modeYears}</p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    pathMode === "yearsToInvest"
                      ? "text-zinc-300 dark:text-zinc-600"
                      : "text-zinc-500",
                  )}
                >
                  {dictionary.calculator.modeYearsDescription}
                </p>
              </button>
              <button
                type="button"
                onClick={() => setPathMode("monthlyToYears")}
                className={cn(
                  "rounded-lg border p-4 text-start transition-colors",
                  pathMode === "monthlyToYears"
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900",
                )}
              >
                <p className="font-medium">
                  {dictionary.calculator.modeMonthly}
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    pathMode === "monthlyToYears"
                      ? "text-zinc-300 dark:text-zinc-600"
                      : "text-zinc-500",
                  )}
                >
                  {dictionary.calculator.modeMonthlyDescription}
                </p>
              </button>
            </div>

            {pathMode === "yearsToInvest" ? (
              <div className="space-y-2">
                <Label htmlFor="years">
                  {dictionary.calculator.yearsToFreedom}
                </Label>
                <Input
                  id="years"
                  inputMode="decimal"
                  placeholder={dictionary.calculator.yearsToFreedomPlaceholder}
                  value={yearsToFreedom}
                  onChange={(event) => setYearsToFreedom(event.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="monthly-investment">
                  {dictionary.calculator.monthlyInvestmentUsd}
                </Label>
                <Input
                  id="monthly-investment"
                  inputMode="decimal"
                  placeholder={
                    dictionary.calculator.monthlyInvestmentPlaceholder
                  }
                  value={monthlyInvestmentUsd}
                  onChange={(event) =>
                    setMonthlyInvestmentUsd(event.target.value)
                  }
                />
              </div>
            )}
          </div>

          {pathUnreachable && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
              {dictionary.calculator.pathUnreachable}
            </p>
          )}

          {monthlyExpenses && !validation.isValid && (
            <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
              {validation.errors.map((errorKey) => (
                <li key={errorKey}>{dictionary.validation[errorKey]}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

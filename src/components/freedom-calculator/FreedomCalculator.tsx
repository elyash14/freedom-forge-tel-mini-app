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
  validateFreedomInputs,
} from "@/lib/freedom-calculator";

type AppConfigResponse = {
  defaultWithdrawalRate: number;
  defaultSavingsPercent: number;
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
  const [savingsGoalPercent, setSavingsGoalPercent] = useState("20");
  const [usdTomanRate, setUsdTomanRate] = useState("");
  const [withdrawalRate, setWithdrawalRate] = useState(0.3);
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

        setWithdrawalRate(config.defaultWithdrawalRate);
        setSavingsGoalPercent(String(config.defaultSavingsPercent));
        setUsdTomanRate(String(rate.rate));
        setRateSource(rate.source);
      } catch {
        setLoadError(dictionary.calculator.loadError);
        setUsdTomanRate("90000");
        setWithdrawalRate(0.3);
        setSavingsGoalPercent("20");
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
      withdrawalRate,
    }),
    [monthlyExpenses, usdTomanRate, withdrawalRate],
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

      <FreedomGauge result={result} locale={locale} dictionary={dictionary} />

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
            {monthlyExpenses && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatToman(Number(monthlyExpenses), locale)}{" "}
                {dictionary.calculator.toman}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="savings-goal">
              {dictionary.calculator.savingsGoal}
            </Label>
            <Input
              id="savings-goal"
              inputMode="decimal"
              value={savingsGoalPercent}
              onChange={(event) => setSavingsGoalPercent(event.target.value)}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {dictionary.calculator.savingsGoalHint.replace(
                "{percent}",
                savingsGoalPercent || "0",
              )}
            </p>
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
              {dictionary.calculator.rateSource}: {rateSourceLabel}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="withdrawal-rate">
                {dictionary.calculator.withdrawalRate}
              </Label>
              <span className="text-sm font-medium tabular-nums">
                {formatPercent(withdrawalRate, locale)}
              </span>
            </div>
            <Slider
              id="withdrawal-rate"
              min={0.01}
              max={1}
              step={0.01}
              value={[withdrawalRate]}
              onValueChange={(value) => setWithdrawalRate(value[0] ?? 0.3)}
            />
            <Input
              inputMode="decimal"
              value={withdrawalRate}
              onChange={(event) =>
                setWithdrawalRate(Number(event.target.value) || 0)
              }
            />
          </div>

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

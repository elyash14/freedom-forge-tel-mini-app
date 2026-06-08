"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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
  calculateFreedom,
  calculateRealReturn,
  calculateWeightedNominalReturn,
  normalizeAllocation,
  validateCalculatorInputs,
  type PortfolioAllocation,
} from "@/lib/freedom-calculator";
import { formatPercent, formatToman, formatYears } from "@/lib/freedom-format";
import { cn } from "@/lib/utils";

type AssetClassDto = {
  id: string;
  key: string;
  labelFa: string;
  labelEn: string;
  historicalNominalReturn: number;
};

type SavedPlan = {
  id: string;
  monthlyExpense: number;
  targetCapital: number;
  yearsToFreedom: number;
  createdAt: string;
};

type FreedomCalculatorProps = {
  locale: Locale;
  dictionary: Dictionary;
};

function assetLabel(asset: AssetClassDto, locale: Locale): string {
  return locale === "fa" ? asset.labelFa : asset.labelEn;
}

export function FreedomCalculator({ locale, dictionary }: FreedomCalculatorProps) {
  const c = dictionary.calculator;
  const [step, setStep] = useState(1);
  const [monthlyExpense, setMonthlyExpense] = useState("");
  const [initialCapital, setInitialCapital] = useState("0");
  const [monthlyContribution, setMonthlyContribution] = useState(5_000_000);
  const [allocation, setAllocation] = useState<PortfolioAllocation>({});
  const [inflationRate, setInflationRate] = useState(0.45);
  const [assetClasses, setAssetClasses] = useState<AssetClassDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [history, setHistory] = useState<SavedPlan[]>([]);

  const initAllocation = useCallback((assets: AssetClassDto[]) => {
    const even = 100 / assets.length;
    setAllocation(Object.fromEntries(assets.map((a) => [a.key, even])));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [configRes, assetsRes, plansRes] = await Promise.all([
          fetch("/api/config"),
          fetch("/api/asset-classes"),
          fetch("/api/plans"),
        ]);

        if (!configRes.ok || !assetsRes.ok) {
          throw new Error("load failed");
        }

        const config = (await configRes.json()) as {
          defaultInflationRate: number;
        };
        const assets = (await assetsRes.json()) as AssetClassDto[];

        setInflationRate(config.defaultInflationRate);
        setAssetClasses(assets);
        initAllocation(assets);

        if (plansRes.ok) {
          const { plans } = (await plansRes.json()) as { plans: SavedPlan[] };
          setHistory(plans);
        }
      } catch {
        setLoadError(c.loadError);
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [c.loadError, initAllocation]);

  const assetInputs = useMemo(
    () =>
      assetClasses.map((a) => ({
        key: a.key,
        historicalNominalReturn: a.historicalNominalReturn,
      })),
    [assetClasses],
  );

  const normalizedAllocation = useMemo(
    () =>
      normalizeAllocation(
        allocation,
        assetClasses.map((a) => a.key),
      ),
    [allocation, assetClasses],
  );

  const allocationTotal = useMemo(
    () =>
      assetClasses.reduce((sum, a) => sum + (allocation[a.key] ?? 0), 0),
    [allocation, assetClasses],
  );

  const parsed = useMemo(
    () => ({
      monthlyExpense: Number(monthlyExpense) || 0,
      initialCapital: Number(initialCapital) || 0,
      allocation: normalizedAllocation,
      assetClasses: assetInputs,
      inflationRate,
      monthlyContribution,
    }),
    [
      monthlyExpense,
      initialCapital,
      normalizedAllocation,
      assetInputs,
      inflationRate,
      monthlyContribution,
    ],
  );

  const validation = useMemo(() => validateCalculatorInputs(parsed), [parsed]);
  const result = useMemo(() => calculateFreedom(parsed), [parsed]);

  const nominalPreview = useMemo(
    () => calculateWeightedNominalReturn(normalizedAllocation, assetInputs),
    [normalizedAllocation, assetInputs],
  );

  const realPreview = useMemo(
    () => calculateRealReturn(nominalPreview, inflationRate),
    [nominalPreview, inflationRate],
  );

  const pmtMax = useMemo(() => {
    const expense = Number(monthlyExpense) || 50_000_000;
    return Math.max(expense, 10_000_000);
  }, [monthlyExpense]);

  function updateAllocation(key: string, value: number) {
    setAllocation((prev) => ({ ...prev, [key]: value }));
  }

  async function savePlan() {
    if (!result) return;
    setSaveState("saving");
    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          monthlyExpense: parsed.monthlyExpense,
          initialCapital: parsed.initialCapital,
          portfolioAllocation: normalizedAllocation,
          inflationRate,
          monthlyContribution,
        }),
      });
      if (!res.ok) throw new Error();
      const { plan } = (await res.json()) as { plan: SavedPlan };
      setHistory((h) => [plan, ...h].slice(0, 20));
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("idle");
    }
  }

  const steps = [c.step1, c.step2, c.step3, c.step4, c.step5];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 text-center sm:text-start">
            <h1 className="text-3xl font-bold tracking-tight">{c.title}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">{c.subtitle}</p>
          </div>
          <LanguageSwitcher
            locale={locale}
            dictionary={dictionary}
            className="justify-center sm:justify-end"
          />
        </div>
        <div className="flex justify-center sm:justify-end">
          <Link
            href={`/${locale}/settings`}
            className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
          >
            {dictionary.nav.settings}
          </Link>
        </div>
        <div className="flex gap-1">
          {steps.map((label, i) => (
            <div
              key={label}
              className={cn(
                "flex-1 rounded-lg border px-2 py-2 text-center text-[10px] font-medium sm:text-xs",
                step === i + 1
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-200 text-zinc-500 dark:border-zinc-800",
              )}
            >
              {i + 1}. {label}
            </div>
          ))}
        </div>
      </header>

      {loadError && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {loadError}
        </p>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{c.step1}</CardTitle>
            <CardDescription>{c.monthlyExpenseHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>{c.monthlyExpense}</Label>
            <Input
              inputMode="numeric"
              placeholder={c.monthlyExpensePlaceholder}
              value={monthlyExpense}
              onChange={(e) => setMonthlyExpense(e.target.value)}
              disabled={isLoading}
            />
            <span className="text-xs text-zinc-500">{c.toman}</span>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{c.step2}</CardTitle>
            <CardDescription>{c.initialCapitalHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>{c.initialCapital}</Label>
            <Input
              inputMode="numeric"
              placeholder={c.initialCapitalPlaceholder}
              value={initialCapital}
              onChange={(e) => setInitialCapital(e.target.value)}
            />
            <span className="text-xs text-zinc-500">{c.toman}</span>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{c.portfolioTitle}</CardTitle>
            <CardDescription>{c.portfolioHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {assetClasses.map((asset) => (
              <div key={asset.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>{assetLabel(asset, locale)}</Label>
                  <span className="font-medium">
                    {Math.round(allocation[asset.key] ?? 0)}%
                  </span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[allocation[asset.key] ?? 0]}
                  onValueChange={(v) => updateAllocation(asset.key, v[0] ?? 0)}
                  disabled={isLoading}
                />
              </div>
            ))}
            <p className="text-xs text-zinc-500">
              {c.allocationTotal}: {Math.round(allocationTotal)}%
            </p>
            <div className="rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-900">
              <p>
                {c.nominalReturn}: {formatPercent(nominalPreview, locale)}
              </p>
              <p className="mt-1">
                {c.realReturn}: {formatPercent(realPreview, locale)}
              </p>
              {realPreview <= 0 && (
                <p className="mt-2 text-amber-700 dark:text-amber-300">
                  {c.realReturnNegative}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && result && (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
          <CardHeader>
            <CardTitle>{c.targetCapital}</CardTitle>
            <CardDescription>{c.targetCapitalHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold tabular-nums">
              {formatToman(result.targetCapital, locale)} {c.toman}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {c.realReturn}: {formatPercent(result.realReturnRate, locale)}
            </p>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>{c.step4}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>{c.monthlyContribution}</Label>
                <span className="text-sm font-medium tabular-nums">
                  {formatToman(monthlyContribution, locale)} {c.toman}
                </span>
              </div>
              <Slider
                min={0}
                max={pmtMax}
                step={500_000}
                value={[monthlyContribution]}
                onValueChange={(v) => setMonthlyContribution(v[0] ?? 0)}
              />
              <p className="text-xs text-zinc-500">{c.monthlyContributionHint}</p>
            </div>

            {result ? (
              <div className="rounded-lg border p-4">
                <p className="text-sm text-zinc-500">{c.yearsToFreedom}</p>
                {result.yearsToFreedom === 0 ? (
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {c.alreadyFree}
                  </p>
                ) : (
                  <p className="text-3xl font-bold tabular-nums">
                    <span dir="ltr">{formatYears(result.yearsToFreedom, locale)}</span>{" "}
                    {c.yearsUnit}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-red-600">
                {validation.errors.includes("realReturnNonPositive")
                  ? c.realReturnNegative
                  : validation.errors.includes("unreachable") ||
                      (!validation.isValid && monthlyContribution > 0)
                    ? c.unreachable
                    : dictionary.validation.unreachable}
              </p>
            )}

            <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
              {c.inflationDisclaimer}
            </p>

            {!validation.isValid && (
              <ul className="text-sm text-red-600">
                {validation.errors.map((key) => (
                  <li key={key}>{dictionary.validation[key]}</li>
                ))}
              </ul>
            )}

            <Button
              type="button"
              className="w-full"
              disabled={!result || saveState === "saving"}
              onClick={() => void savePlan()}
            >
              {saveState === "saving"
                ? c.saving
                : saveState === "saved"
                  ? c.saved
                  : c.save}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 5 && result && (
        <Card>
          <CardHeader>
            <CardTitle>{c.projectionTitle}</CardTitle>
            <CardDescription>{c.projectionHint}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b text-start text-xs text-zinc-500">
                  <th className="py-2 pe-2">{c.colYear}</th>
                  <th className="py-2 pe-2">{c.colStart}</th>
                  <th className="py-2 pe-2">{c.colContribution}</th>
                  <th className="py-2 pe-2">{c.colReturn}</th>
                  <th className="py-2">{c.colEnd}</th>
                </tr>
              </thead>
              <tbody>
                {result.projection.map((row) => (
                  <tr
                    key={row.year}
                    className={cn(
                      "border-b border-zinc-100 dark:border-zinc-800",
                      row.endingCapital >= result.targetCapital &&
                        "bg-emerald-50 font-medium dark:bg-emerald-950/30",
                    )}
                  >
                    <td className="py-2 pe-2 tabular-nums">{row.year}</td>
                    <td className="py-2 pe-2 tabular-nums">
                      {formatToman(row.startingCapital, locale)}
                    </td>
                    <td className="py-2 pe-2 tabular-nums">
                      {formatToman(row.annualContribution, locale)}
                    </td>
                    <td className="py-2 pe-2 tabular-nums">
                      {formatToman(row.returnEarned, locale)}
                    </td>
                    <td className="py-2 tabular-nums">
                      {formatToman(row.endingCapital, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>{c.historyTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-zinc-500">{c.noHistory}</p>
            ) : (
              <ul className="space-y-2">
                {history.map((plan) => (
                  <li
                    key={plan.id}
                    className="flex justify-between rounded-lg border p-3 text-sm"
                  >
                    <span className="tabular-nums">
                      {formatToman(plan.monthlyExpense, locale)} {c.toman}/mo
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatYears(plan.yearsToFreedom, locale)} {c.yearsUnit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setStep((s) => s - 1)}
          >
            {c.back}
          </Button>
        )}
        {step < 5 && (
          <Button
            type="button"
            className="flex-1"
            disabled={
              (step === 1 && (!monthlyExpense || Number(monthlyExpense) <= 0)) ||
              (step === 2 && Number(initialCapital) < 0) ||
              (step === 3 && realPreview <= 0)
            }
            onClick={() => setStep((s) => s + 1)}
          >
            {c.next}
          </Button>
        )}
      </div>
    </div>
  );
}

"use client";

import { Calculator, Check, Target } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { Slider } from "@/components/ui/slider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import {
  buildAcceleratingInflationProjection,
  buildNominalYearlyProjection,
  calculateFreedom,
  nominalTargetCapitalAccelerating,
  nominalTargetCapitalAtYear,
  normalizeAllocation,
  validateCalculatorInputs,
  type PortfolioAllocation,
  type ProjectionScenario,
} from "@/lib/freedom-calculator";
import {
  formatInteger,
  formatPercent,
  formatProjectionCalendarYear,
  formatTomanCompact,
  formatYears,
} from "@/lib/freedom-format";
import {
  calculateExpectedInflation,
  calculateHistoricalNominalReturn,
  calculateHistoricalRealReturn,
  calculateAssetHistoricalNominalReturn,
  calculateAssetHistoricalRealReturn,
  calculateInflationDelta,
  type HistoricalReturnRow,
} from "@/lib/historical-returns";
import {
  buildCustomReturnsMap,
  customAssetKey,
  type CustomAssetDto,
} from "@/lib/custom-assets";
import { parseLocalizedNumber } from "@/lib/numeric-input";
import { cn } from "@/lib/utils";

type AssetClassDto = {
  id: string;
  key: string;
  labelFa: string;
  labelEn: string;
};

type PortfolioItem = {
  key: string;
  label: string;
  isCustom: boolean;
  annualReturnRate?: number;
};

type CapitalInputMode = "total" | "perAsset";

type FreedomCalculatorProps = {
  locale: Locale;
  dictionary: Dictionary;
};

function assetLabel(asset: AssetClassDto, locale: Locale): string {
  return locale === "fa" ? asset.labelFa : asset.labelEn;
}

type CalculatorStepNavProps = {
  steps: string[];
  currentStep: number;
  visitedSteps: Set<number>;
  onStepChange: (step: number) => void;
};

function CalculatorStepNav({
  steps,
  currentStep,
  visitedSteps,
  onStepChange,
}: CalculatorStepNavProps) {
  return (
    <nav aria-label="Calculator steps">
      <ol className="flex w-full items-start">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isActive = currentStep === stepNumber;
          const isComplete = visitedSteps.has(stepNumber) && !isActive;
          const isLast = index === steps.length - 1;
          const isLineBeforeActive =
            stepNumber <= currentStep || visitedSteps.has(stepNumber);
          const isLineAfterActive =
            !isLast &&
            (currentStep > stepNumber || visitedSteps.has(stepNumber + 1));

          return (
            <li
              key={label}
              className="flex min-w-0 flex-1 flex-col items-center"
            >
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-colors",
                    index === 0 && "invisible",
                    isLineBeforeActive
                      ? "bg-[var(--tg-theme-button-color,var(--primary))]/60"
                      : "bg-[var(--tg-theme-secondary-bg-color,var(--border))]",
                  )}
                />
                <button
                  type="button"
                  onClick={() => onStepChange(stepNumber)}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`${stepNumber}. ${label}`}
                  className={cn(
                    "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    isActive &&
                      "border-[var(--tg-theme-button-color,var(--primary))] bg-[var(--tg-theme-button-color,var(--primary))] text-[var(--tg-theme-button-text-color,var(--primary-foreground))]",
                    isComplete &&
                      !isActive &&
                      "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    !isActive &&
                      !isComplete &&
                      "border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-section-bg-color,var(--card))] text-[var(--tg-theme-hint-color,var(--muted-foreground))]",
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : stepNumber}
                </button>
                <div
                  className={cn(
                    "h-0.5 flex-1 transition-colors",
                    isLast && "invisible",
                    isLineAfterActive
                      ? "bg-[var(--tg-theme-button-color,var(--primary))]/60"
                      : "bg-[var(--tg-theme-secondary-bg-color,var(--border))]",
                  )}
                />
              </div>
              <button
                type="button"
                onClick={() => onStepChange(stepNumber)}
                className={cn(
                  "mt-2 w-full px-0.5 text-center text-[10px] font-medium leading-tight sm:text-[11px]",
                  isActive
                    ? "text-[var(--tg-theme-text-color,var(--foreground))]"
                    : "text-[var(--tg-theme-hint-color,var(--muted-foreground))]",
                )}
              >
                <span className="line-clamp-2">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

type ModernSegmentProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
};

function ModernSegment<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: ModernSegmentProps<T>) {
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

type ModernChoiceListProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  ariaLabel: string;
};

function ModernChoiceList<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: ModernChoiceListProps<T>) {
  return (
    <div className="space-y-2" role="radiogroup" aria-label={ariaLabel}>
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
              "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-start text-sm font-medium transition-all",
              isActive
                ? "bg-[var(--tg-theme-button-color,var(--primary))]/12 text-[var(--tg-theme-text-color,var(--foreground))] ring-2 ring-[var(--tg-theme-button-color,var(--primary))]/35"
                : "bg-[var(--tg-theme-secondary-bg-color,var(--muted))] text-[var(--tg-theme-hint-color,var(--muted-foreground))]",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isActive
                  ? "border-[var(--tg-theme-button-color,var(--primary))] bg-[var(--tg-theme-button-color,var(--primary))]"
                  : "border-[var(--tg-theme-hint-color,var(--muted-foreground))]/40",
              )}
            >
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--tg-theme-button-text-color,var(--primary-foreground))]" />
              )}
            </span>
            <span className="min-w-0 leading-snug">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function FreedomCalculator({ locale, dictionary }: FreedomCalculatorProps) {
  const c = dictionary.calculator;
  const [step, setStep] = useState(1);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(() => new Set([1]));
  const [monthlyExpense, setMonthlyExpense] = useState("");
  const [initialCapital, setInitialCapital] = useState("0");
  const [capitalInputMode, setCapitalInputMode] =
    useState<CapitalInputMode>("total");
  const [assetCapitals, setAssetCapitals] = useState<Record<string, string>>(
    {},
  );
  const [monthlyContribution, setMonthlyContribution] = useState(5_000_000);
  const [allocation, setAllocation] = useState<PortfolioAllocation>({});
  const [historicalData, setHistoricalData] = useState<HistoricalReturnRow[]>(
    [],
  );
  const [assetClasses, setAssetClasses] = useState<AssetClassDto[]>([]);
  const [customAssets, setCustomAssets] = useState<CustomAssetDto[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [projectionScenario, setProjectionScenario] =
    useState<ProjectionScenario>("real");

  useEffect(() => {
    setVisitedSteps((prev) => {
      if (prev.has(step)) {
        return prev;
      }

      const next = new Set(prev);
      next.add(step);
      return next;
    });
  }, [step]);

  const goToStep = useCallback((nextStep: number) => {
    setStep(nextStep);
  }, []);

  const initAllocation = useCallback((keys: string[]) => {
    if (keys.length === 0) {
      setAllocation({});
      return;
    }

    const even = 100 / keys.length;
    setAllocation(Object.fromEntries(keys.map((key) => [key, even])));
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [historicalRes, assetsRes, customRes] = await Promise.all([
          fetch("/api/historical-returns"),
          fetch("/api/asset-classes"),
          fetch("/api/custom-assets"),
        ]);

        if (!historicalRes.ok || !assetsRes.ok) {
          throw new Error("load failed");
        }

        const historical = (await historicalRes.json()) as HistoricalReturnRow[];
        const assets = (await assetsRes.json()) as AssetClassDto[];
        const custom = customRes.ok
          ? ((await customRes.json()) as { assets: CustomAssetDto[] }).assets
          : [];

        setHistoricalData(historical);
        setAssetClasses(assets);
        setCustomAssets(custom);

        const keys = [
          ...assets.map((asset) => asset.key),
          ...custom.map((asset) => customAssetKey(asset.id)),
        ];
        initAllocation(keys);
      } catch {
        setLoadError(c.loadError);
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [c.loadError, initAllocation]);

  const portfolioItems = useMemo<PortfolioItem[]>(
    () => [
      ...assetClasses.map((asset) => ({
        key: asset.key,
        label: assetLabel(asset, locale),
        isCustom: false,
      })),
      ...customAssets.map((asset) => ({
        key: customAssetKey(asset.id),
        label: asset.name,
        isCustom: true,
        annualReturnRate: asset.annualReturnRate,
      })),
    ],
    [assetClasses, customAssets, locale],
  );

  const assetKeys = useMemo(
    () => portfolioItems.map((item) => item.key),
    [portfolioItems],
  );

  const customReturns = useMemo(
    () => buildCustomReturnsMap(customAssets),
    [customAssets],
  );

  const normalizedAllocation = useMemo(
    () => normalizeAllocation(allocation, assetKeys),
    [allocation, assetKeys],
  );

  const allocationTotal = useMemo(
    () => portfolioItems.reduce((sum, item) => sum + (allocation[item.key] ?? 0), 0),
    [allocation, portfolioItems],
  );

  const activeAssets = useMemo(
    () => portfolioItems.filter((item) => (allocation[item.key] ?? 0) > 0),
    [portfolioItems, allocation],
  );

  const effectiveInitialCapital = useMemo(() => {
    if (capitalInputMode === "total") {
      return parseLocalizedNumber(initialCapital) ?? 0;
    }

    return activeAssets.reduce((sum, item) => {
      const value = assetCapitals[item.key] ?? "";
      return sum + (parseLocalizedNumber(value) ?? 0);
    }, 0);
  }, [capitalInputMode, initialCapital, assetCapitals, activeAssets]);

  const parsed = useMemo(
    () => ({
      monthlyExpense: parseLocalizedNumber(monthlyExpense) ?? 0,
      initialCapital: effectiveInitialCapital,
      allocation: normalizedAllocation,
      historicalData,
      monthlyContribution,
      customReturns,
    }),
    [
      monthlyExpense,
      effectiveInitialCapital,
      normalizedAllocation,
      historicalData,
      monthlyContribution,
      customReturns,
    ],
  );

  const validation = useMemo(() => validateCalculatorInputs(parsed), [parsed]);
  const result = useMemo(() => calculateFreedom(parsed), [parsed]);

  const nominalPreview = useMemo(
    () =>
      calculateHistoricalNominalReturn(
        normalizedAllocation,
        historicalData,
        customReturns,
      ),
    [normalizedAllocation, historicalData, customReturns],
  );

  const realPreview = useMemo(
    () =>
      calculateHistoricalRealReturn(
        normalizedAllocation,
        historicalData,
        customReturns,
      ),
    [normalizedAllocation, historicalData, customReturns],
  );

  const assetReturnByKey = useMemo(() => {
    const stats: Record<
      string,
      { nominal: number | null; real: number | null }
    > = {};

    for (const item of portfolioItems) {
      stats[item.key] = {
        nominal: calculateAssetHistoricalNominalReturn(
          item.key,
          historicalData,
          customReturns,
        ),
        real: calculateAssetHistoricalRealReturn(
          item.key,
          historicalData,
          customReturns,
        ),
      };
    }

    return stats;
  }, [portfolioItems, historicalData, customReturns]);

  const pmtMax = useMemo(() => {
    const expense = parseLocalizedNumber(monthlyExpense) ?? 50_000_000;
    return Math.max(expense, 10_000_000);
  }, [monthlyExpense]);

  const expectedInflation = useMemo(
    () => calculateExpectedInflation(historicalData),
    [historicalData],
  );

  const inflationDelta = useMemo(
    () => calculateInflationDelta(historicalData),
    [historicalData],
  );

  const isNominalScenario =
    projectionScenario === "fixed" || projectionScenario === "accelerating";

  const projectionRows = useMemo(() => {
    if (!result) {
      return [];
    }

    const years = result.projection.length;

    if (projectionScenario === "fixed") {
      return buildNominalYearlyProjection(
        result.initialCapital,
        result.monthlyContribution,
        result.realReturnRate,
        expectedInflation,
        years,
      );
    }

    if (projectionScenario === "accelerating") {
      return buildAcceleratingInflationProjection(
        result.initialCapital,
        result.monthlyContribution,
        result.realReturnRate,
        expectedInflation,
        inflationDelta,
        years,
      );
    }

    return result.projection;
  }, [
    result,
    projectionScenario,
    expectedInflation,
    inflationDelta,
  ]);

  const projectionScenarios = useMemo(
    () =>
      [
        { id: "real" as const, label: c.projectionRealTerms },
        { id: "fixed" as const, label: c.projectionFixedInflation },
        {
          id: "accelerating" as const,
          label: c.projectionAcceleratingInflation,
        },
      ] satisfies { id: ProjectionScenario; label: string }[],
    [
      c.projectionRealTerms,
      c.projectionFixedInflation,
      c.projectionAcceleratingInflation,
    ],
  );

  function formatProjectionAmount(value: number): string {
    return formatTomanCompact(value, locale);
  }

  function projectionHint(): string {
    if (projectionScenario === "fixed") {
      return c.projectionHintNominal.replace(
        "{rate}",
        formatPercent(expectedInflation, locale),
      );
    }

    if (projectionScenario === "accelerating") {
      return c.projectionHintAccelerating
        .replace("{rate}", formatPercent(expectedInflation, locale))
        .replace("{delta}", formatPercent(inflationDelta, locale));
    }

    return c.projectionHint;
  }

  function isFreedomYear(endingCapital: number, year: number): boolean {
    if (!result) {
      return false;
    }

    if (projectionScenario === "fixed") {
      return (
        endingCapital >=
        nominalTargetCapitalAtYear(
          result.targetCapital,
          expectedInflation,
          year,
        )
      );
    }

    if (projectionScenario === "accelerating") {
      return (
        endingCapital >=
        nominalTargetCapitalAccelerating(
          result.targetCapital,
          expectedInflation,
          inflationDelta,
          year,
        )
      );
    }

    return endingCapital >= result.targetCapital;
  }

  function updateAllocation(key: string, value: number) {
    setAllocation((prev) => ({ ...prev, [key]: value }));
  }

  function updateAssetCapital(key: string, value: string) {
    setAssetCapitals((prev) => ({ ...prev, [key]: value }));
  }

  function buildAssetCapitalsToSave(): Record<string, number> {
    const result: Record<string, number> = {};

    if (capitalInputMode === "perAsset") {
      for (const item of activeAssets) {
        const value = parseLocalizedNumber(assetCapitals[item.key] ?? "") ?? 0;
        result[item.key] = value;
      }
      return result;
    }

    const total = effectiveInitialCapital;
    let remaining = total;

    activeAssets.forEach((item, index) => {
      if (index === activeAssets.length - 1) {
        result[item.key] = remaining;
        return;
      }

      const weight = normalizedAllocation[item.key] ?? 0;
      const portion = Math.round(total * (weight / 100));
      result[item.key] = portion;
      remaining -= portion;
    });

    return result;
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
          assetCapitals: buildAssetCapitalsToSave(),
          portfolioAllocation: normalizedAllocation,
          monthlyContribution,
        }),
      });
      if (!res.ok) throw new Error();
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveState("idle");
    }
  }

  const steps = [c.step1, c.step2, c.step3, c.step4, c.step5];

  const stepNextDisabled =
    (step === 1 && (parseLocalizedNumber(monthlyExpense) ?? 0) <= 0) ||
    (step === 2 && (realPreview <= 0 || historicalData.length === 0)) ||
    (step === 3 && effectiveInitialCapital < 0);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-6 px-4 py-8 pb-28">
      <header className="space-y-4">
        <PageHeader
          icon={Calculator}
          title={c.title}
          subtitle={c.subtitle}
        />
        <CalculatorStepNav
          steps={steps}
          currentStep={step}
          visitedSteps={visitedSteps}
          onStepChange={goToStep}
        />
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
            <NumericInput
              locale={locale}
              unitLabel={c.toman}
              placeholder={c.monthlyExpensePlaceholder}
              value={monthlyExpense}
              onChange={setMonthlyExpense}
              disabled={isLoading}
            />
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{c.portfolioTitle}</CardTitle>
            <CardDescription>{c.portfolioHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {portfolioItems.map((item) => {
              const returns = assetReturnByKey[item.key];

              return (
              <div key={item.key} className="space-y-2">
                <div className="flex justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <Label>{item.label}</Label>
                    {returns?.nominal != null && returns.real != null && (
                      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                        <span>
                          {c.nominalReturn}:{" "}
                          <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
                            {formatPercent(returns.nominal, locale)}
                          </span>
                        </span>
                        <span>
                          {c.realReturnGeometric}:{" "}
                          <span
                            className={cn(
                              "tabular-nums",
                              returns.real <= 0
                                ? "text-amber-700 dark:text-amber-300"
                                : "text-zinc-700 dark:text-zinc-300",
                            )}
                          >
                            {formatPercent(returns.real, locale)}
                          </span>
                        </span>
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 font-medium">
                    {Math.round(allocation[item.key] ?? 0)}%
                  </span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[allocation[item.key] ?? 0]}
                  onValueChange={(v) => updateAllocation(item.key, v[0] ?? 0)}
                  disabled={isLoading}
                />
              </div>
            );
            })}
            <p className="text-xs text-zinc-500">
              {c.allocationTotal}: {Math.round(allocationTotal)}%
            </p>
            <p className="text-xs text-zinc-500">
              {c.historicalDataYears.replace(
                "{years}",
                formatInteger(historicalData.length, locale),
              )}
            </p>
            <div className="rounded-lg bg-zinc-100 p-4 text-sm dark:bg-zinc-900">
              <p>
                {c.portfolioNominalReturn}: {formatPercent(nominalPreview, locale)}
              </p>
              <p className="mt-1 font-semibold">
                {c.realReturnGeometric}: {formatPercent(realPreview, locale)}
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

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{c.step3}</CardTitle>
            <CardDescription>
              {capitalInputMode === "total"
                ? c.initialCapitalHint
                : c.perAssetCapitalHint}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500">
                {c.capitalInputModeLabel}
              </Label>
              <ModernSegment
                value={capitalInputMode}
                onChange={setCapitalInputMode}
                ariaLabel={c.capitalInputModeLabel}
                options={[
                  { value: "total", label: c.capitalInputModeTotal },
                  { value: "perAsset", label: c.capitalInputModePerAsset },
                ]}
              />
            </div>

            {capitalInputMode === "total" ? (
              <div className="space-y-2">
                <Label>{c.initialCapital}</Label>
                <NumericInput
                  locale={locale}
                  unitLabel={c.toman}
                  placeholder={c.initialCapitalPlaceholder}
                  value={initialCapital}
                  onChange={setInitialCapital}
                />
              </div>
            ) : (
              <div className="space-y-4">
                {activeAssets.map((item) => (
                  <div
                    key={item.key}
                    className="space-y-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/50"
                  >
                    <Label>{item.label}</Label>
                    <NumericInput
                      locale={locale}
                      unitLabel={c.toman}
                      placeholder="0"
                      value={assetCapitals[item.key] ?? ""}
                      onChange={(value) => updateAssetCapital(item.key, value)}
                    />
                  </div>
                ))}
                <div className="flex justify-between border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
                  <span className="text-zinc-500">{c.totalCapitalLabel}</span>
                  <span className="font-medium tabular-nums">
                    {formatTomanCompact(effectiveInitialCapital, locale)}{" "}
                    {c.toman}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 4 && result && (
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-[#6C9BCF]/15 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Target className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{c.targetCapital}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{c.targetCapitalHint}</p>
              <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">
                {formatTomanCompact(result.targetCapital, locale)}{" "}
                <span className="text-lg font-medium text-zinc-500">
                  {c.toman}
                </span>
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {c.realReturnGeometric}:{" "}
                <span className="font-medium tabular-nums text-emerald-700 dark:text-emerald-300">
                  {formatPercent(result.realReturnRate, locale)}
                </span>
              </p>
            </div>
          </div>
        </div>
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
                  {formatTomanCompact(monthlyContribution, locale)} {c.toman}
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
              <div className="rounded-2xl bg-[var(--tg-theme-secondary-bg-color,var(--muted))] p-4">
                <p className="text-sm text-zinc-500">{c.yearsToFreedom}</p>
                {result.yearsToFreedom === 0 ? (
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    {c.alreadyFree}
                  </p>
                ) : (
                  <p className="text-3xl font-bold tabular-nums">
                    <span dir="ltr">
                      {formatYears(result.yearsToFreedom, locale)}
                    </span>{" "}
                    {c.yearsUnit}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-red-600">
                {validation.errors.includes("realReturnNonPositive")
                  ? c.realReturnNegative
                  : validation.errors.includes("historicalDataMissing")
                    ? c.historicalDataMissing
                    : c.unreachable}
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
          </CardContent>
        </Card>
      )}

      {step === 5 && !result && (
        <Card>
          <CardHeader>
            <CardTitle>{c.projectionTitle}</CardTitle>
            <CardDescription>{c.unreachable}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {step === 5 && result && (
        <Card>
          <CardHeader>
            <CardTitle>{c.projectionTitle}</CardTitle>
            <CardDescription>{projectionHint()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500">{c.projectionScenario}</Label>
              <ModernChoiceList
                value={projectionScenario}
                onChange={setProjectionScenario}
                ariaLabel={c.projectionScenario}
                options={projectionScenarios.map((scenario) => ({
                  value: scenario.id,
                  label: scenario.label,
                }))}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-start text-xs text-zinc-500">
                    <th className="py-2 pe-2">{c.colYear}</th>
                    <th className="py-2 pe-2">{c.colExpectedInflation}</th>
                    <th className="py-2 pe-2">{c.colMonthlyStart}</th>
                    <th className="py-2 pe-2">{c.colStart}</th>
                    <th className="py-2 pe-2">{c.colContribution}</th>
                    <th className="py-2 pe-2">
                      {isNominalScenario ? c.colReturnNominal : c.colReturn}
                    </th>
                    <th className="py-2">{c.colEnd}</th>
                  </tr>
                </thead>
                <tbody>
                  {projectionRows.map((row) => (
                    <tr
                      key={row.year}
                      className={cn(
                        "border-b border-zinc-100 dark:border-zinc-800",
                        isFreedomYear(row.endingCapital, row.year) &&
                          "bg-emerald-50 font-medium dark:bg-emerald-950/30",
                      )}
                    >
                      <td className="py-2 pe-2 tabular-nums">
                        <span dir="ltr">
                          {formatProjectionCalendarYear(row.year, locale)}
                        </span>
                      </td>
                      <td className="py-2 pe-2 tabular-nums">
                        {formatPercent(row.inflationRate, locale)}
                      </td>
                      <td className="py-2 pe-2 tabular-nums">
                        {formatProjectionAmount(row.monthlyContributionStart)}
                      </td>
                      <td className="py-2 pe-2 tabular-nums">
                        {formatProjectionAmount(row.startingCapital)}
                      </td>
                      <td className="py-2 pe-2 tabular-nums">
                        {formatProjectionAmount(row.annualContribution)}
                      </td>
                      <td className="py-2 pe-2 tabular-nums">
                        {formatProjectionAmount(row.returnEarned)}
                      </td>
                      <td className="py-2 tabular-nums">
                        {formatProjectionAmount(row.endingCapital)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-bg-color,var(--background))] p-3">
        <div className="mx-auto flex max-w-2xl gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-[var(--tg-theme-secondary-bg-color,var(--border))]"
              onClick={() => goToStep(step - 1)}
            >
              {c.back}
            </Button>
          )}
          {step < 5 && (
            <Button
              type="button"
              className="flex-1 bg-[var(--tg-theme-button-color,var(--primary))] text-[var(--tg-theme-button-text-color,var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
              disabled={
                step < 4
                  ? stepNextDisabled
                  : !result
              }
              onClick={() => goToStep(step + 1)}
            >
              {c.next}
            </Button>
          )}
          {step === 5 && (
            <Button
              type="button"
              className="flex-1 bg-[var(--tg-theme-button-color,var(--primary))] text-[var(--tg-theme-button-text-color,var(--primary-foreground))] hover:opacity-90 disabled:opacity-50"
              disabled={!result || saveState === "saving"}
              onClick={() => void savePlan()}
            >
              {saveState === "saving"
                ? c.saving
                : saveState === "saved"
                  ? c.saved
                  : c.save}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ChevronRight, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { resolveAssetColor } from "@/lib/asset-colors";
import { isCustomPortfolioKey } from "@/lib/custom-portfolios";
import { isFreeformExternalKey } from "@/lib/external-holdings";
import { formatTomanCompact, formatYears } from "@/lib/freedom-format";
import type { CombinedBreakdownItem, PortfolioTotals } from "@/lib/home-stats";
import {
  calculateElapsedMonths,
  calculateRemainingMonths,
  formatYearsAndMonths,
} from "@/lib/home-stats";

type FreedomPlanDto = {
  id: string;
  monthlyExpense: number;
  targetCapital: number;
  monthlyContribution: number;
  yearsToFreedom: number;
  assetCapitals?: Record<string, number>;
};

type PlanProgressDto = {
  id: string;
  year: number;
  month: number;
  assetDetails?: Record<string, { contribution: number; totalValue: number }>;
};

type PlanListItem = {
  id: string;
  monthlyExpense: number;
  targetCapital: number;
  yearsToFreedom: number;
};

type AssetGroup = {
  id: "standard" | "custom" | "other";
  title: string;
  items: CombinedBreakdownItem[];
};

type HomePageProps = {
  locale: Locale;
  dictionary: Dictionary;
};

const PLAN_CHIP_COLOR = "#6C9BCF";
const EXTERNAL_CHIP_COLOR = "#E8B86D";

export function HomePage({ locale, dictionary }: HomePageProps) {
  const h = dictionary.home;
  const ea = dictionary.externalAssets;
  const [plan, setPlan] = useState<FreedomPlanDto | null>(null);
  const [progress, setProgress] = useState<PlanProgressDto[]>([]);
  const [combinedBreakdown, setCombinedBreakdown] = useState<
    CombinedBreakdownItem[]
  >([]);
  const [assetColors, setAssetColors] = useState<Record<string, string>>({});
  const [totals, setTotals] = useState<PortfolioTotals>({
    planTotal: 0,
    externalTotal: 0,
    grandTotal: 0,
  });
  const [plans, setPlans] = useState<PlanListItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPlanPickerOpen, setIsPlanPickerOpen] = useState(false);
  const [isSelectingPlan, setIsSelectingPlan] = useState(false);

  const loadHome = useCallback(async () => {
    try {
      const [homeRes, plansRes] = await Promise.all([
        fetch(`/api/user/selected-plan?locale=${locale}`),
        fetch("/api/plans"),
      ]);

      if (!homeRes.ok) {
        throw new Error("load failed");
      }

      const homeData = await homeRes.json();
      setSelectedPlanId(homeData.selectedPlanId ?? null);
      setPlan(homeData.plan ?? null);
      setProgress(homeData.progress ?? []);
      setCombinedBreakdown(homeData.combinedBreakdown ?? []);
      setAssetColors(homeData.assetColors ?? {});
      setTotals(
        homeData.totals ?? {
          planTotal: 0,
          externalTotal: 0,
          grandTotal: 0,
        },
      );
      setLoadError(null);

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setPlans(plansData.plans ?? []);
      }
    } catch {
      setLoadError(h.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [h.loadError, locale]);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  const hasProgress = progress.length > 0;
  const hasAnyAssets = totals.grandTotal > 0;

  const elapsedMonths = useMemo(
    () => calculateElapsedMonths(progress),
    [progress],
  );

  const remainingMonths = useMemo(() => {
    if (!plan) {
      return 0;
    }

    return calculateRemainingMonths(plan.yearsToFreedom, elapsedMonths);
  }, [plan, elapsedMonths]);

  const pieData = useMemo(
    () =>
      combinedBreakdown.map((item) => ({
        name: item.label,
        value: item.totalValue,
        key: item.key,
      })),
    [combinedBreakdown],
  );

  const groupedAssets = useMemo((): AssetGroup[] => {
    const standard: CombinedBreakdownItem[] = [];
    const custom: CombinedBreakdownItem[] = [];
    const other: CombinedBreakdownItem[] = [];

    for (const item of combinedBreakdown) {
      if (isFreeformExternalKey(item.key)) {
        other.push(item);
      } else if (isCustomPortfolioKey(item.key)) {
        custom.push(item);
      } else {
        standard.push(item);
      }
    }

    const groups: AssetGroup[] = [
      { id: "standard", title: ea.standardSection, items: standard },
      { id: "custom", title: ea.customSection, items: custom },
      { id: "other", title: ea.otherSection, items: other },
    ];

    return groups.filter((group) => group.items.length > 0);
  }, [combinedBreakdown, ea.standardSection, ea.customSection, ea.otherSection]);

  async function selectPlan(planId: string) {
    setIsSelectingPlan(true);
    try {
      const res = await fetch("/api/user/selected-plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (!res.ok) {
        throw new Error("select failed");
      }

      setIsPlanPickerOpen(false);
      setIsLoading(true);
      await loadHome();
    } catch {
      setLoadError(h.loadError);
    } finally {
      setIsSelectingPlan(false);
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-zinc-500">Loading...</div>;
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {loadError}
        </p>
      </div>
    );
  }

  if (!plan && !hasAnyAssets) {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-6 px-4 py-8 pb-24">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">{h.title}</h1>
        </header>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--tg-theme-secondary-bg-color,var(--border))] px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
            <Wallet className="h-7 w-7 text-zinc-400" />
          </div>
          <p className="text-sm text-zinc-500">{h.noPlan}</p>
          <Link
            href={`/${locale}/calculator`}
            className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--tg-theme-button-color,var(--primary))] px-4 py-2 text-sm font-medium text-[var(--tg-theme-button-text-color,var(--primary-foreground))]"
          >
            {h.startCalculating}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-5 px-4 py-6 pb-24">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{h.title}</h1>
        {hasAnyAssets && (
          <Link
            href={`/${locale}/external-assets`}
            className="text-sm font-medium text-[var(--tg-theme-link-color,var(--primary))]"
          >
            {h.manageExternal}
          </Link>
        )}
      </header>

      {hasAnyAssets && (
        <>
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#6C9BCF]/15 via-[#7DD3C0]/10 to-[#E8B86D]/15 p-5 ring-1 ring-[var(--tg-theme-secondary-bg-color,var(--border))]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6C9BCF]/20 text-[#6C9BCF]">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500">{h.grandTotal}</p>
                <p className="text-2xl font-bold tabular-nums tracking-tight">
                  {formatTomanCompact(totals.grandTotal, locale)}{" "}
                  <span className="text-base font-medium text-zinc-500">
                    {h.toman}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-white/60 px-3 py-2 dark:bg-zinc-900/40">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  {h.inPlan}
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums">
                  {formatTomanCompact(totals.planTotal, locale)}
                </p>
              </div>
              <div className="rounded-xl bg-white/60 px-3 py-2 dark:bg-zinc-900/40">
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  {h.outOfPlan}
                </p>
                <p className="mt-0.5 text-sm font-semibold tabular-nums">
                  {formatTomanCompact(totals.externalTotal, locale)}
                </p>
              </div>
            </div>
          </div>

          {pieData.length > 0 && (
            <section className="rounded-2xl border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-section-bg-color,var(--card))] p-4">
              <h2 className="mb-1 text-sm font-semibold">{h.assetsBreakdown}</h2>
              {!hasProgress && plan && (
                <p className="mb-3 text-xs text-zinc-500">{h.noProgress}</p>
              )}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      cornerRadius={6}
                      innerRadius={56}
                      outerRadius={88}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={resolveAssetColor(entry.key, assetColors)}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background:
                          "var(--tg-theme-section-bg-color, var(--card))",
                        border:
                          "1px solid var(--tg-theme-secondary-bg-color, var(--border))",
                        borderRadius: "10px",
                        fontSize: "12px",
                        color: "var(--tg-theme-text-color, var(--foreground))",
                      }}
                      formatter={(value) =>
                        `${formatTomanCompact(Number(value), locale)} ${h.toman}`
                      }
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          <section className="space-y-4">
            {groupedAssets.map((group) => (
              <div key={group.id} className="space-y-2">
                <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {group.title}
                </h2>
                <div className="space-y-2">
                  {group.items.map((item) => {
                    const color = resolveAssetColor(item.key, assetColors);
                    const share =
                      totals.grandTotal > 0
                        ? Math.round((item.totalValue / totals.grandTotal) * 100)
                        : 0;

                    return (
                      <div
                        key={item.key}
                        className="rounded-2xl border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-section-bg-color,var(--card))] p-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${color}22` }}
                          >
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate font-medium">{item.label}</p>
                              <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                                {share}%
                              </span>
                            </div>
                            <p className="mt-0.5 text-lg font-semibold tabular-nums">
                              {formatTomanCompact(item.totalValue, locale)}{" "}
                              <span className="text-sm font-normal text-zinc-500">
                                {h.toman}
                              </span>
                            </p>
                            {(item.planValue > 0 || item.externalValue > 0) && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.planValue > 0 && (
                                  <span
                                    className="rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums"
                                    style={{
                                      backgroundColor: `${PLAN_CHIP_COLOR}22`,
                                      color: PLAN_CHIP_COLOR,
                                    }}
                                  >
                                    {h.inPlan}{" "}
                                    {formatTomanCompact(item.planValue, locale)}
                                  </span>
                                )}
                                {item.externalValue > 0 && (
                                  <span
                                    className="rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums"
                                    style={{
                                      backgroundColor: `${EXTERNAL_CHIP_COLOR}22`,
                                      color: EXTERNAL_CHIP_COLOR,
                                    }}
                                  >
                                    {h.outOfPlan}{" "}
                                    {formatTomanCompact(
                                      item.externalValue,
                                      locale,
                                    )}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        </>
      )}

      {plan ? (
        <section className="space-y-3 border-t border-[var(--tg-theme-secondary-bg-color,var(--border))] pt-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-zinc-500">
              {h.activePlan}
            </h2>
            <Button
              type="button"
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={() => setIsPlanPickerOpen(true)}
            >
              {h.changePlan}
            </Button>
          </div>

          <Link
            href={`/${locale}/plans/${plan.id}`}
            className="flex items-center justify-between rounded-2xl border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-section-bg-color,var(--card))] p-4 transition-colors hover:opacity-90"
          >
            <div>
              <p className="font-medium tabular-nums">
                {formatTomanCompact(plan.monthlyExpense, locale)} {h.toman}/mo
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {h.targetCapital}:{" "}
                {formatTomanCompact(plan.targetCapital, locale)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatYears(plan.yearsToFreedom, locale)}
              </span>
              <ChevronRight className="h-4 w-4 text-zinc-400" />
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-section-bg-color,var(--card))] p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {h.elapsedLabel}
              </p>
              <p className="mt-1 text-sm font-bold tabular-nums">
                {formatYearsAndMonths(elapsedMonths, locale)}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-section-bg-color,var(--card))] p-3">
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {h.remainingLabel}
              </p>
              <p className="mt-1 text-sm font-bold tabular-nums">
                {formatYearsAndMonths(remainingMonths, locale)}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-zinc-50 px-3 py-2.5 dark:bg-zinc-900/50">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {h.monthlyContribution}
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
              {formatTomanCompact(plan.monthlyContribution, locale)} {h.toman}
            </p>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-[var(--tg-theme-secondary-bg-color,var(--border))] px-6 py-8 text-center">
          <p className="text-sm text-zinc-500">{h.noPlan}</p>
          <Link
            href={`/${locale}/calculator`}
            className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[var(--tg-theme-button-color,var(--primary))] px-4 py-2 text-sm font-medium text-[var(--tg-theme-button-text-color,var(--primary-foreground))]"
          >
            {h.startCalculating}
          </Link>
        </section>
      )}

      <Drawer open={isPlanPickerOpen} onOpenChange={setIsPlanPickerOpen}>
        <DrawerContent className="mx-auto max-h-[80vh] sm:max-w-lg">
          <DrawerHeader className="text-start">
            <DrawerTitle>{h.selectPlanTitle}</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-2 overflow-y-auto px-4 pb-6">
            {plans.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={isSelectingPlan}
                onClick={() => void selectPlan(item.id)}
                className="flex w-full items-center justify-between rounded-xl border p-4 text-start text-sm transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:hover:bg-zinc-900/50"
              >
                <span className="tabular-nums">
                  {formatTomanCompact(item.monthlyExpense, locale)} {h.toman}/mo
                </span>
                <span className="flex items-center gap-2">
                  {item.id === selectedPlanId && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {h.activePlanBadge}
                    </span>
                  )}
                  <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatYears(item.yearsToFreedom, locale)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

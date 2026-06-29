"use client";

import Link from "next/link";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { formatTomanCompact, formatYears } from "@/lib/freedom-format";
import {
  buildAssetBreakdown,
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

type HomePageProps = {
  locale: Locale;
  dictionary: Dictionary;
};

/** Refined palette for asset breakdown — works on light and Telegram dark themes */
const CHART_COLORS = [
  "#6C9BCF", // cerulean
  "#7DD3C0", // seafoam
  "#E8B86D", // champagne gold
  "#B794F6", // soft violet
  "#F687B3", // blush rose
  "#4FD1C5", // turquoise
  "#FCA5A5", // muted coral
  "#94A3B8", // slate mist
  "#A78BFA", // periwinkle
  "#34D399", // jade
];

export function HomePage({ locale, dictionary }: HomePageProps) {
  const h = dictionary.home;
  const [plan, setPlan] = useState<FreedomPlanDto | null>(null);
  const [progress, setProgress] = useState<PlanProgressDto[]>([]);
  const [assetLabels, setAssetLabels] = useState<Record<string, string>>({});
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
      setAssetLabels(homeData.assetLabels ?? {});
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

  const latestProgress = progress.at(-1) ?? null;
  const hasProgress = progress.length > 0;

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

  const breakdown = useMemo(() => {
    if (!plan) {
      return [];
    }

    return buildAssetBreakdown(
      latestProgress?.assetDetails,
      plan.assetCapitals,
      assetLabels,
    );
  }, [plan, latestProgress, assetLabels]);

  const chartData = useMemo(
    () =>
      breakdown.map((item) => ({
        name: item.label,
        value: item.value,
      })),
    [breakdown],
  );

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
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {loadError}
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-6 px-4 py-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">{h.title}</h1>
        </header>
        <Card>
          <CardContent className="space-y-4 py-8 text-center">
            <p className="text-sm text-zinc-500">{h.noPlan}</p>
            <Link
              href={`/${locale}/calculator`}
              className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--tg-theme-button-color,var(--primary))] px-4 py-2 text-sm font-medium text-[var(--tg-theme-button-text-color,var(--primary-foreground))]"
            >
              {h.startCalculating}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-6 px-4 py-8 pb-24">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{h.title}</h1>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle>{h.activePlan}</CardTitle>
            <CardDescription>
              {formatTomanCompact(plan.monthlyExpense, locale)} {h.toman}/mo
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={() => setIsPlanPickerOpen(true)}
          >
            {h.changePlan}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/50">
              <p className="text-xs text-zinc-500">{h.monthlyExpense}</p>
              <p className="mt-1 font-semibold tabular-nums">
                {formatTomanCompact(plan.monthlyExpense, locale)} {h.toman}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/50">
              <p className="text-xs text-zinc-500">{h.targetCapital}</p>
              <p className="mt-1 font-semibold tabular-nums">
                {formatTomanCompact(plan.targetCapital, locale)} {h.toman}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/50">
              <p className="text-xs text-zinc-500">{h.monthlyContribution}</p>
              <p className="mt-1 font-semibold tabular-nums">
                {formatTomanCompact(plan.monthlyContribution, locale)} {h.toman}
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}/plans/${plan.id}`}
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-section-bg-color,var(--card))] px-4 py-2 text-sm font-medium"
          >
            {h.viewPlan}
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{h.elapsedLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {formatYearsAndMonths(elapsedMonths, locale)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{h.remainingLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">
              {formatYearsAndMonths(remainingMonths, locale)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{h.assetsBreakdown}</CardTitle>
          {!hasProgress && (
            <CardDescription>{h.noProgress}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-sm text-zinc-500">{h.noProgress}</p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    cornerRadius={6}
                    innerRadius={52}
                    outerRadius={84}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--tg-theme-section-bg-color, var(--card))",
                      border: "1px solid var(--tg-theme-secondary-bg-color, var(--border))",
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
                    wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

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
                className="flex w-full items-center justify-between rounded-lg border p-4 text-start text-sm transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:hover:bg-zinc-900/50"
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

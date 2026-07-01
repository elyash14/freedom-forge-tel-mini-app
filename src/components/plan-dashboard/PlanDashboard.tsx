"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Plus, Trash2, Wallet } from "lucide-react";

import { useTelegram } from "@/components/telegram/telegram-provider";
import { useTelegramBackButton } from "@/components/telegram/use-telegram-back-button";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { buildAssetColorMap, resolveAssetColor } from "@/lib/asset-colors";
import {
  buildNominalYearlyProjection,
  type PortfolioAllocation,
  type ProjectionRow,
} from "@/lib/freedom-calculator";
import { formatTomanCompact, formatYears } from "@/lib/freedom-format";
import {
  calculateExpectedInflation,
  type HistoricalReturnRow,
} from "@/lib/historical-returns";
import {
  customAssetKey,
  isCustomAssetKey,
} from "@/lib/custom-assets";
import { buildAssetBreakdown } from "@/lib/home-stats";
import { parseLocalizedNumber } from "@/lib/numeric-input";

type FreedomPlanDto = {
  id: string;
  monthlyExpense: number;
  initialCapital: number;
  assetCapitals?: Record<string, number>;
  portfolioAllocation: PortfolioAllocation;
  nominalReturnRate: number;
  realReturnRate: number;
  monthlyContribution: number;
  targetCapital: number;
  yearsToFreedom: number;
};

type PlanProgressDto = {
  id: string;
  year: number;
  month: number;
  contribution: number;
  totalValue: number;
  assetDetails?: Record<string, { contribution: number; totalValue: number }>;
};

type PlanDashboardProps = {
  locale: Locale;
  planId: string;
  dictionary: Dictionary;
};

function buildAssetInputDefaults(
  plan: FreedomPlanDto,
  progress: PlanProgressDto[],
  year: number,
  month: number,
): Record<string, { contribution: string; totalValue: string }> {
  const existing = progress.find(
    (record) => record.year === year && record.month === month,
  );

  if (existing?.assetDetails) {
    return Object.fromEntries(
      Object.entries(existing.assetDetails).map(([key, value]) => [
        key,
        {
          contribution:
            value.contribution > 0 ? String(value.contribution) : "",
          totalValue: value.totalValue > 0 ? String(value.totalValue) : "",
        },
      ]),
    );
  }

  const sorted = [...progress].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const latestBefore = sorted
    .filter(
      (record) =>
        record.year < year || (record.year === year && record.month < month),
    )
    .at(-1);

  if (latestBefore?.assetDetails) {
    return Object.fromEntries(
      Object.entries(latestBefore.assetDetails).map(([key, value]) => [
        key,
        {
          contribution: "",
          totalValue: value.totalValue > 0 ? String(value.totalValue) : "",
        },
      ]),
    );
  }

  const capitals = plan.assetCapitals ?? {};
  const defaults: Record<string, { contribution: string; totalValue: string }> =
    {};

  for (const [key, weight] of Object.entries(plan.portfolioAllocation)) {
    if ((weight || 0) <= 0) continue;

    const capital = capitals[key];
    defaults[key] = {
      contribution: "",
      totalValue: capital != null && capital > 0 ? String(capital) : "",
    };
  }

  return defaults;
}

function getPlannedMonthlyContribution(
  projectionRows: ProjectionRow[],
  year: number,
): number | null {
  return projectionRows.find((row) => row.year === year)?.monthlyContributionStart ?? null;
}

function getPlannedCapitalAtMonth(
  initialCapital: number,
  projectionRows: ProjectionRow[],
  year: number,
  month: number,
): number | null {
  const projection = projectionRows.find((row) => row.year === year);
  if (!projection) return null;

  const previousCapital =
    year === 1
      ? initialCapital
      : projectionRows.find((row) => row.year === year - 1)?.endingCapital ?? 0;
  const monthlyGrowth = (projection.endingCapital - previousCapital) / 12;

  return previousCapital + monthlyGrowth * month;
}

type AssetGroup = {
  id: "standard" | "custom";
  title: string;
  items: { key: string; label: string; value: number }[];
};

export function PlanDashboard({ locale, planId, dictionary }: PlanDashboardProps) {
  const p = dictionary.planDashboard;
  const h = dictionary.home;
  const ea = dictionary.externalAssets;
  const { isTelegram } = useTelegram();
  const router = useRouter();
  const plansHref = `/${locale}/plans`;

  useTelegramBackButton({
    visible: isTelegram,
    onClick: () => router.push(plansHref),
  });

  const [plan, setPlan] = useState<FreedomPlanDto | null>(null);
  const [progress, setProgress] = useState<PlanProgressDto[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalReturnRow[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [inputYear, setInputYear] = useState("1");
  const [inputMonth, setInputMonth] = useState("1");
  const [assetInputs, setAssetInputs] = useState<Record<string, { contribution: string, totalValue: string }>>({});
  const [assetBaselines, setAssetBaselines] = useState<Record<string, number>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [chartRange, setChartRange] = useState<[number, number]>([10, 10]);

  // Asset classes lookup
  const [assetClasses, setAssetClasses] = useState<Record<string, string>>({});
  const [assetColors, setAssetColors] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      const [planRes, progressRes, historicalRes, assetClassesRes, customRes] =
        await Promise.all([
        fetch(`/api/plans/${planId}`),
        fetch(`/api/plans/${planId}/progress`),
        fetch(`/api/historical-returns`),
        fetch(`/api/asset-classes`),
        fetch(`/api/custom-assets`),
      ]);

      if (planRes.ok) {
        const data = await planRes.json();
        setPlan(data.plan);
      }
      if (progressRes.ok) {
        const data = await progressRes.json();
        setProgress(data.progressRecords);
      }
      if (historicalRes.ok) {
        const data = await historicalRes.json();
        setHistoricalData(data);
      }
      const lookup: Record<string, string> = {};
      const colorSources: Parameters<typeof buildAssetColorMap>[0] = [];
      const customColorSources: Parameters<typeof buildAssetColorMap>[1] = [];

      if (assetClassesRes.ok) {
        const data = await assetClassesRes.json();
        data.forEach(
          (a: {
            key: string;
            labelFa: string;
            labelEn: string;
            color: string;
          }) => {
            lookup[a.key] = locale === "fa" ? a.labelFa : a.labelEn;
            colorSources.push({ key: a.key, color: a.color });
          },
        );
      }

      if (customRes?.ok) {
        const data = (await customRes.json()) as {
          assets: { id: string; name: string; color: string }[];
        };
        for (const asset of data.assets) {
          lookup[customAssetKey(asset.id)] = asset.name;
          customColorSources.push({
            id: asset.id,
            color: asset.color,
          });
        }
      }

      if (assetClassesRes.ok || customRes?.ok) {
        setAssetClasses(lookup);
        setAssetColors(buildAssetColorMap(colorSources, customColorSources));
      }
    } finally {
      setIsLoading(false);
    }
  }, [planId, locale]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!plan || !isDrawerOpen) return;

    const defaults = buildAssetInputDefaults(
      plan,
      progress,
      parseLocalizedNumber(inputYear) ?? 1,
      parseLocalizedNumber(inputMonth) ?? 1,
    );

    setAssetInputs(defaults);

    const baselines: Record<string, number> = {};
    for (const [key, value] of Object.entries(defaults)) {
      const total = parseLocalizedNumber(value.totalValue) ?? 0;
      const contribution = parseLocalizedNumber(value.contribution) ?? 0;
      baselines[key] = total - contribution;
    }
    setAssetBaselines(baselines);
  }, [plan, progress, isDrawerOpen, inputYear, inputMonth]);

  const maxYear = useMemo(() => {
    if (!plan) return 10;
    return Math.max(
      Math.ceil(plan.yearsToFreedom),
      progress.length > 0 ? Math.max(...progress.map((p) => p.year)) : 1,
    );
  }, [plan, progress]);

  // Set initial chart range once we know the max year
  useEffect(() => {
    if (plan) {
      setChartRange([maxYear, maxYear]);
    }
  }, [maxYear, plan]);

  const activeAssets = useMemo(() => {
    if (!plan) return [];
    const alloc = plan.portfolioAllocation;
    return Object.keys(alloc).filter(key => (alloc[key] || 0) > 0);
  }, [plan]);

  const totalContribution = useMemo(() => {
    return Object.values(assetInputs).reduce(
      (sum, val) => sum + (parseLocalizedNumber(val.contribution ?? "") ?? 0),
      0,
    );
  }, [assetInputs]);

  const totalValue = useMemo(() => {
    return Object.values(assetInputs).reduce(
      (sum, val) => sum + (parseLocalizedNumber(val.totalValue ?? "") ?? 0),
      0,
    );
  }, [assetInputs]);

  const canSaveProgress = totalContribution !== 0 || totalValue !== 0;

  const expectedInflation = useMemo(
    () => calculateExpectedInflation(historicalData),
    [historicalData],
  );

  const projectionRows = useMemo(() => {
    if (!plan || historicalData.length === 0) return [];

    const years = Math.max(1, Math.ceil(plan.yearsToFreedom));
    
    // We use nominal projection for charting actual value since totalValue logged by user is in nominal (today's currency context but affected by inflation over time naturally)
    // Actually the user will be logging values as they are in reality (which is nominal).
    return buildNominalYearlyProjection(
      plan.initialCapital,
      plan.monthlyContribution,
      plan.realReturnRate,
      expectedInflation,
      years,
    );
  }, [plan, historicalData.length, expectedInflation]);

  const chartData = useMemo(() => {
    if (!plan) return [];

    // Let's generate data points. For simplicity, we'll map planned data yearly and actual data interpolated or mapped to the nearest year/month.
    // To have a nice chart, we can make the X-axis represent "Year.Month" or just cumulative months.
    
    const maxYear = Math.max(
      Math.ceil(plan.yearsToFreedom),
      progress.length > 0 ? Math.max(...progress.map((p) => p.year)) : 1,
    );

    const data: any[] = [];
    
    // Starting point
    data.push({
      year: 0,
      time: 0,
      label: `Y0 M0`,
      planned: plan.initialCapital,
      actual: plan.initialCapital,
    });

    for (let y = 1; y <= maxYear; y++) {
      const proj = projectionRows.find((r) => r.year === y);
      
      for (let m = 1; m <= 12; m++) {
        // Interpolate planned value linearly across months for a smoother curve
        let plannedValue = null;
        if (proj) {
          const prevCap = y === 1 ? plan.initialCapital : projectionRows.find(r => r.year === y - 1)?.endingCapital ?? 0;
          const monthlyGrowth = (proj.endingCapital - prevCap) / 12;
          plannedValue = prevCap + monthlyGrowth * m;
        }

        const prog = progress.find((p) => p.year === y && p.month === m);
        
        // Only push data points where actual exists or at the end of the year to not clutter the chart
        if (prog || m === 12) {
           data.push({
            year: y,
            time: (y - 1) * 12 + m,
            label: `Y${y} M${m}`,
            planned: plannedValue,
            actual: prog ? prog.totalValue : undefined,
          });
        }
      }
    }
    
    return data.filter(d => d.year === 0 || d.year <= chartRange[0]);
  }, [plan, projectionRows, progress, maxYear, chartRange]);

  const latestProgress = useMemo(() => progress.at(-1) ?? null, [progress]);

  const currentTotal = useMemo(() => {
    if (latestProgress) {
      return latestProgress.totalValue;
    }

    return plan?.initialCapital ?? 0;
  }, [latestProgress, plan]);

  const assetBreakdown = useMemo(() => {
    if (!plan) {
      return [];
    }

    return buildAssetBreakdown(
      latestProgress?.assetDetails,
      plan.assetCapitals,
      assetClasses,
    );
  }, [plan, latestProgress, assetClasses]);

  const pieData = useMemo(
    () =>
      assetBreakdown.map((item) => ({
        name: item.label,
        value: item.value,
        key: item.key,
      })),
    [assetBreakdown],
  );

  const groupedAssets = useMemo((): AssetGroup[] => {
    const standard: AssetGroup["items"] = [];
    const custom: AssetGroup["items"] = [];

    for (const item of assetBreakdown) {
      if (isCustomAssetKey(item.key)) {
        custom.push(item);
      } else {
        standard.push(item);
      }
    }

    const groups: AssetGroup[] = [
      { id: "standard", title: ea.standardSection, items: standard },
      { id: "custom", title: ea.customSection, items: custom },
    ];

    return groups.filter((group) => group.items.length > 0);
  }, [assetBreakdown, ea.standardSection, ea.customSection]);

  const progressPercent = useMemo(() => {
    if (!plan || plan.targetCapital <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((currentTotal / plan.targetCapital) * 100));
  }, [plan, currentTotal]);

  const breakdownTotal = useMemo(
    () => assetBreakdown.reduce((sum, item) => sum + item.value, 0),
    [assetBreakdown],
  );

  function parseAssetInputNumber(value: string): number {
    return parseLocalizedNumber(value) ?? 0;
  }

  function updateAssetInput(assetKey: string, field: "contribution" | "totalValue", value: string) {
    if (field === "contribution") {
      setAssetInputs((prev) => {
        const baseline = assetBaselines[assetKey] ?? 0;
        const contribution = parseAssetInputNumber(value);
        const total = baseline + contribution;

        return {
          ...prev,
          [assetKey]: {
            contribution: value,
            totalValue: total > 0 ? String(total) : baseline > 0 ? String(baseline) : "",
          },
        };
      });
      return;
    }

    setAssetInputs((prev) => {
      const contribution = parseAssetInputNumber(
        prev[assetKey]?.contribution ?? "",
      );
      const newTotal = parseAssetInputNumber(value);

      setAssetBaselines((baselines) => ({
        ...baselines,
        [assetKey]: newTotal - contribution,
      }));

      return {
        ...prev,
        [assetKey]: {
          ...prev[assetKey],
          totalValue: value,
        },
      };
    });
  }

  async function saveProgress() {
    setSaveState("saving");
    try {
      // Build asset details JSON object
      const assetDetails: Record<string, { contribution: number; totalValue: number }> = {};
      Object.keys(assetInputs).forEach(key => {
        assetDetails[key] = {
          contribution: parseLocalizedNumber(assetInputs[key]?.contribution ?? "") ?? 0,
          totalValue: parseLocalizedNumber(assetInputs[key]?.totalValue ?? "") ?? 0,
        };
      });

      const res = await fetch(`/api/plans/${planId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseLocalizedNumber(inputYear) ?? 1,
          month: parseLocalizedNumber(inputMonth) ?? 1,
          contribution: totalContribution,
          totalValue: totalValue,
          assetDetails,
        }),
      });
      if (res.ok) {
        setSaveState("saved");
        setAssetInputs({});
        void loadData(); // Reload progress
        setTimeout(() => {
          setSaveState("idle");
          setIsDrawerOpen(false);
        }, 1000);
      } else {
        setSaveState("idle");
      }
    } catch {
      setSaveState("idle");
    }
  }

  async function deleteProgress(progressId: string) {
    if (!confirm(p.deleteProgressConfirm)) return;
    try {
      await fetch(`/api/plans/${planId}/progress/${progressId}`, {
        method: "DELETE",
      });
      void loadData();
    } catch (e) {
      console.error("Failed to delete", e);
    }
  }

  async function deletePlan() {
    if (!confirm(p.deletePlanConfirm)) return;

    setIsDeletingPlan(true);
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: "DELETE" });
      if (res.ok) {
        router.push(plansHref);
      }
    } catch (e) {
      console.error("Failed to delete plan", e);
    } finally {
      setIsDeletingPlan(false);
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!plan) {
    return <div className="p-8 text-center">Plan not found</div>;
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-5 px-4 py-6 pb-[calc(8rem+env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{p.title}</h1>
        {!isTelegram && (
          <Link
            href={plansHref}
            className="text-sm font-medium text-[var(--tg-theme-link-color,var(--primary))]"
          >
            {p.backToPlans}
          </Link>
        )}
      </header>

      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#6C9BCF]/15 via-[#7DD3C0]/10 to-[#E8B86D]/15 p-5 ring-1 ring-[var(--tg-theme-secondary-bg-color,var(--border))]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6C9BCF]/20 text-[#6C9BCF]">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-500">{p.totalValueLabel}</p>
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              {formatTomanCompact(currentTotal, locale)}{" "}
              <span className="text-base font-medium text-zinc-500">
                {p.toman}
              </span>
            </p>
          </div>
          <div className="text-end">
            <p className="text-xs text-zinc-500">{p.yearsToFreedom}</p>
            <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              <span dir="ltr">{formatYears(plan.yearsToFreedom, locale)}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>{p.targetCapital}</span>
            <span className="tabular-nums">
              {formatTomanCompact(plan.targetCapital, locale)} {p.toman}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/60 dark:bg-zinc-900/40">
            <div
              className="h-full rounded-full bg-[#6C9BCF] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-end text-[10px] font-medium tabular-nums text-zinc-500">
            {progressPercent}%
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/60 px-3 py-2 dark:bg-zinc-900/40">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {p.monthlyContribution}
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
              {formatTomanCompact(plan.monthlyContribution, locale)}
            </p>
          </div>
          <div className="rounded-xl bg-white/60 px-3 py-2 dark:bg-zinc-900/40">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              {p.colContribution}
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">
              {latestProgress
                ? formatTomanCompact(latestProgress.contribution, locale)
                : "—"}
            </p>
          </div>
        </div>
      </div>

      {pieData.length > 0 && (
        <section className="rounded-2xl border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-section-bg-color,var(--card))] p-4">
          <h2 className="mb-1 text-sm font-semibold">{h.assetsBreakdown}</h2>
          {progress.length === 0 && (
            <p className="mb-3 text-xs text-zinc-500">{p.noProgress}</p>
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
                    `${formatTomanCompact(Number(value), locale)} ${p.toman}`
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

      {groupedAssets.length > 0 && (
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
                    breakdownTotal > 0
                      ? Math.round((item.value / breakdownTotal) * 100)
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
                            {formatTomanCompact(item.value, locale)}{" "}
                            <span className="text-sm font-normal text-zinc-500">
                              {p.toman}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="rounded-2xl border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-section-bg-color,var(--card))] p-4">
        <h2 className="mb-3 text-sm font-semibold">{p.chartTitle}</h2>
        <div className="space-y-3 pb-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <Label>{p.chartRangeLabel}</Label>
            <span className="font-medium tabular-nums">
              {locale === "fa"
                ? `تا سال ${chartRange[0]}`
                : `Up to year ${chartRange[0]}`}
            </span>
          </div>
          <Slider
            min={1}
            max={maxYear}
            step={1}
            value={[chartRange[0]]}
            onValueChange={(val) => setChartRange([val[0], maxYear])}
            className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
          />
        </div>
        <div className="relative -mx-2 h-72 min-w-0 w-auto sm:mx-0 sm:w-full">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <LineChart
              data={chartData}
              margin={{
                top: 12,
                right: locale === "fa" ? 4 : 8,
                left: locale === "fa" ? 8 : 4,
                bottom: 4,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--tg-theme-secondary-bg-color, #e5e7eb)"
              />
              <XAxis
                dataKey="time"
                type="number"
                domain={["dataMin", "dataMax"]}
                allowDecimals={false}
                ticks={chartData.map((point) => point.time)}
                tickFormatter={(time) => {
                  const point = chartData.find((item) => item.time === time);
                  return point?.label ?? String(time);
                }}
                padding={{ left: 0, right: 0 }}
                tick={{ fontSize: 11 }}
                tickMargin={8}
                stroke="var(--tg-theme-hint-color, #9ca3af)"
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(val) =>
                  formatTomanCompact(val as number, locale)
                }
                width={locale === "fa" ? 56 : 64}
                tick={{ fontSize: 11 }}
                tickMargin={4}
                stroke="var(--tg-theme-hint-color, #9ca3af)"
                orientation={locale === "fa" ? "right" : "left"}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                labelFormatter={(time) => {
                  const point = chartData.find((item) => item.time === time);
                  return point?.label ?? String(time);
                }}
                formatter={(value) => [
                  `${formatTomanCompact(Number(value ?? 0), locale)} ${p.toman}`,
                  "",
                ]}
                contentStyle={{
                  borderRadius: "10px",
                  border:
                    "1px solid var(--tg-theme-secondary-bg-color, #e5e7eb)",
                  background: "var(--tg-theme-section-bg-color, #fff)",
                  color: "var(--tg-theme-text-color, #111)",
                  fontSize: "12px",
                }}
              />
              <Legend
                iconType="line"
                iconSize={14}
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
              />
              <Line
                type="monotone"
                dataKey="planned"
                name={p.chartPlanned}
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="actual"
                name={p.chartActual}
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="space-y-3 border-t border-[var(--tg-theme-secondary-bg-color,var(--border))] pt-5">
        <h2 className="text-sm font-semibold text-zinc-500">{p.logTitle}</h2>
        {progress.length === 0 ? (
          <p className="text-sm text-zinc-500">{p.noProgress}</p>
        ) : (
          <div className="space-y-2">
            {[...progress].reverse().map((prog) => {
              const plannedContribution = getPlannedMonthlyContribution(
                projectionRows,
                prog.year,
              );
              const plannedCapital = getPlannedCapitalAtMonth(
                plan.initialCapital,
                projectionRows,
                prog.year,
                prog.month,
              );

              return (
                <div
                  key={prog.id}
                  className="rounded-2xl border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-section-bg-color,var(--card))] p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium tabular-nums">
                        {p.colYear} {prog.year} · {p.colMonth} {prog.month}
                      </p>
                      <p className="mt-1 text-lg font-semibold tabular-nums">
                        {formatTomanCompact(prog.totalValue, locale)}{" "}
                        <span className="text-sm font-normal text-zinc-500">
                          {p.toman}
                        </span>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 w-9 shrink-0 px-0 text-red-500"
                      onClick={() => void deleteProgress(prog.id)}
                      aria-label={p.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-zinc-50 px-2.5 py-2 dark:bg-zinc-900/50">
                      <p className="text-zinc-500">{p.colContribution}</p>
                      <p className="mt-0.5 font-semibold tabular-nums">
                        {formatTomanCompact(prog.contribution, locale)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 px-2.5 py-2 dark:bg-zinc-900/50">
                      <p className="text-zinc-500">{p.colPlannedContribution}</p>
                      <p className="mt-0.5 font-semibold tabular-nums text-zinc-500">
                        {plannedContribution != null
                          ? formatTomanCompact(plannedContribution, locale)
                          : "—"}
                      </p>
                    </div>
                    <div className="col-span-2 rounded-lg bg-zinc-50 px-2.5 py-2 dark:bg-zinc-900/50">
                      <p className="text-zinc-500">{p.colPlannedCapital}</p>
                      <p className="mt-0.5 font-semibold tabular-nums text-zinc-500">
                        {plannedCapital != null
                          ? formatTomanCompact(plannedCapital, locale)
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isDeletingPlan}
            onClick={() => void deletePlan()}
            className="text-red-600 dark:text-red-400"
          >
            <Trash2 className="me-2 h-4 w-4" />
            {p.deletePlan}
          </Button>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-bg-color,var(--background))] p-3 sm:hidden">
        {isDrawerOpen ? (
          <Button
            type="button"
            className="h-12 w-full"
            disabled={!canSaveProgress || saveState === "saving"}
            onClick={() => void saveProgress()}
          >
            {saveState === "saving"
              ? p.saving
              : saveState === "saved"
                ? p.saved
                : p.saveProgress}
          </Button>
        ) : (
          <Button
            type="button"
            className="h-12 w-full"
            onClick={() => setIsDrawerOpen(true)}
          >
            <Plus className="me-2 h-5 w-5" />
            {p.addProgressTitle}
          </Button>
        )}
      </div>

      <div className="hidden sm:block">
        <Button
          type="button"
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] end-8 z-40 h-14 rounded-full px-6 shadow-lg"
          onClick={() => setIsDrawerOpen(true)}
        >
          <Plus className="me-2 h-5 w-5" />
          {p.addProgressTitle}
        </Button>
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="mx-auto max-h-[90vh] sm:max-w-lg">
          <DrawerHeader className="text-start">
            <DrawerTitle>{p.addProgressTitle}</DrawerTitle>
            <DrawerDescription>{p.addProgressHint}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{p.yearLabel}</Label>
                  <NumericInput
                    locale={locale}
                    kind="integer"
                    value={inputYear}
                    onChange={setInputYear}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{p.monthLabel}</Label>
                  <NumericInput
                    locale={locale}
                    kind="integer"
                    value={inputMonth}
                    onChange={setInputMonth}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {activeAssets.map((assetKey) => {
                  const label = assetClasses[assetKey] || assetKey;
                  const vals = assetInputs[assetKey] || {
                    contribution: "",
                    totalValue: "",
                  };
                  const color = resolveAssetColor(assetKey, assetColors);

                  return (
                    <div
                      key={assetKey}
                      className="rounded-2xl border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-section-bg-color,var(--card))] p-3.5"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${color}22` }}
                        >
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        </div>
                        <Label className="font-medium">{label}</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-zinc-500">
                            {p.contributionLabel}
                          </Label>
                          <NumericInput
                            locale={locale}
                            kind="money"
                            unitLabel={p.toman}
                            value={vals.contribution || ""}
                            onChange={(value) =>
                              updateAssetInput(assetKey, "contribution", value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-zinc-500">
                            {p.totalValueLabel}
                          </Label>
                          <NumericInput
                            locale={locale}
                            kind="money"
                            unitLabel={p.toman}
                            value={vals.totalValue || ""}
                            onChange={(value) =>
                              updateAssetInput(assetKey, "totalValue", value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">
                    {p.overallTotalLabel} {p.contributionLabel}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatTomanCompact(totalContribution, locale)} {p.toman}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-zinc-500">
                    {p.overallTotalLabel} {p.totalValueLabel}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatTomanCompact(totalValue, locale)} {p.toman}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                className="hidden h-12 w-full sm:flex"
                disabled={
                  (totalContribution === 0 && totalValue === 0) ||
                  saveState === "saving"
                }
                onClick={() => void saveProgress()}
              >
                {saveState === "saving"
                  ? p.saving
                  : saveState === "saved"
                    ? p.saved
                    : p.saveProgress}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

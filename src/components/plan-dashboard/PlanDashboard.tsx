"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Plus, Trash2 } from "lucide-react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/types";
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

export function PlanDashboard({ locale, planId, dictionary }: PlanDashboardProps) {
  const p = dictionary.planDashboard;

  const [plan, setPlan] = useState<FreedomPlanDto | null>(null);
  const [progress, setProgress] = useState<PlanProgressDto[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalReturnRow[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [inputYear, setInputYear] = useState("1");
  const [inputMonth, setInputMonth] = useState("1");
  const [assetInputs, setAssetInputs] = useState<Record<string, { contribution: string, totalValue: string }>>({});
  const [assetBaselines, setAssetBaselines] = useState<Record<string, number>>({});
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [chartRange, setChartRange] = useState<[number, number]>([10, 10]);

  // Asset classes lookup
  const [assetClasses, setAssetClasses] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      const [planRes, progressRes, historicalRes, assetClassesRes] = await Promise.all([
        fetch(`/api/plans/${planId}`),
        fetch(`/api/plans/${planId}/progress`),
        fetch(`/api/historical-returns`),
        fetch(`/api/asset-classes`),
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
      if (assetClassesRes.ok) {
        const data = await assetClassesRes.json();
        const lookup: Record<string, string> = {};
        data.forEach((a: any) => {
          lookup[a.key] = locale === "fa" ? a.labelFa : a.labelEn;
        });
        setAssetClasses(lookup);
      }
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!plan || !isDrawerOpen) return;

    const defaults = buildAssetInputDefaults(
      plan,
      progress,
      Number(inputYear) || 1,
      Number(inputMonth) || 1,
    );

    setAssetInputs(defaults);

    const baselines: Record<string, number> = {};
    for (const [key, value] of Object.entries(defaults)) {
      const total = Number(value.totalValue.replace(/,/g, "")) || 0;
      const contribution = Number(value.contribution.replace(/,/g, "")) || 0;
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
    return Object.values(assetInputs).reduce((sum, val) => sum + (Number(val.contribution?.replace(/,/g, '')) || 0), 0);
  }, [assetInputs]);

  const totalValue = useMemo(() => {
    return Object.values(assetInputs).reduce((sum, val) => sum + (Number(val.totalValue?.replace(/,/g, '')) || 0), 0);
  }, [assetInputs]);

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

  function parseAssetInputNumber(value: string): number {
    return Number(value.replace(/,/g, "")) || 0;
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
          contribution: Number(assetInputs[key]?.contribution?.replace(/,/g, "")) || 0,
          totalValue: Number(assetInputs[key]?.totalValue?.replace(/,/g, "")) || 0,
        };
      });

      const res = await fetch(`/api/plans/${planId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseInt(inputYear),
          month: parseInt(inputMonth),
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
    if (!confirm("Are you sure?")) return;
    try {
      await fetch(`/api/plans/${planId}/progress/${progressId}`, {
        method: "DELETE",
      });
      void loadData();
    } catch (e) {
      console.error("Failed to delete", e);
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!plan) {
    return <div className="p-8 text-center">Plan not found</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8 pb-24">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 text-center sm:text-start">
            <h1 className="text-3xl font-bold tracking-tight">{p.title}</h1>
          </div>
          <LanguageSwitcher
            locale={locale}
            dictionary={dictionary}
            className="justify-center sm:justify-end"
          />
        </div>
        <Link
          href={`/${locale}`}
          className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          {p.backToCalculator}
        </Link>
      </header>

      <div className="flex flex-col gap-6">
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {p.targetCapital}
              </p>
              <p className="text-2xl font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
                {formatTomanCompact(plan.targetCapital, locale)} {p.toman}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                {p.yearsToFreedom}
              </p>
              <p className="text-2xl font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
                <span dir="ltr">{formatYears(plan.yearsToFreedom, locale)}</span>{" "}
                {p.yearsUnit}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>{p.chartTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 pb-2">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <Label>{p.chartRangeLabel}</Label>
                <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
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
            
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12 }} 
                  tickMargin={10} 
                  stroke="#9ca3af" 
                />
                <YAxis
                  tickFormatter={(val) => formatTomanCompact(val as number, locale)}
                  width={80}
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  orientation={locale === "fa" ? "right" : "left"}
                />
                <Tooltip
                  formatter={(value: any) => [
                    `${formatTomanCompact(Number(value), locale)} ${p.toman}`,
                    "",
                  ]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="planned"
                  name={p.chartPlanned}
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name={p.chartActual}
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{p.logTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {progress.length === 0 ? (
              <p className="text-sm text-zinc-500">{p.noProgress}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-start text-xs text-zinc-500">
                      <th className="py-2 pe-2">{p.colYear}</th>
                      <th className="py-2 pe-2">{p.colMonth}</th>
                      <th className="py-2 pe-2">{p.colContribution}</th>
                      <th className="py-2 pe-2">{p.colPlannedContribution}</th>
                      <th className="py-2 pe-2">{p.colTotalValue}</th>
                      <th className="py-2 pe-2">{p.colPlannedCapital}</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.map((prog) => {
                      const plannedContribution = getPlannedMonthlyContribution(
                        projectionRows,
                        prog.year,
                      );
                      const plannedCapital = plan
                        ? getPlannedCapitalAtMonth(
                            plan.initialCapital,
                            projectionRows,
                            prog.year,
                            prog.month,
                          )
                        : null;

                      return (
                      <tr key={prog.id} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-2 pe-2 tabular-nums">{prog.year}</td>
                        <td className="py-2 pe-2 tabular-nums">{prog.month}</td>
                        <td className="py-2 pe-2 tabular-nums">
                          {formatTomanCompact(prog.contribution, locale)}
                        </td>
                        <td className="py-2 pe-2 tabular-nums text-zinc-500">
                          {plannedContribution != null
                            ? formatTomanCompact(plannedContribution, locale)
                            : "—"}
                        </td>
                        <td className="py-2 pe-2 tabular-nums font-medium">
                          {formatTomanCompact(prog.totalValue, locale)}
                        </td>
                        <td className="py-2 pe-2 tabular-nums text-zinc-500">
                          {plannedCapital != null
                            ? formatTomanCompact(plannedCapital, locale)
                            : "—"}
                        </td>
                        <td className="py-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                            onClick={() => void deleteProgress(prog.id)}
                            title={p.delete}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/80 p-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 sm:hidden">
        <Button className="w-full rounded-full" size="lg" onClick={() => setIsDrawerOpen(true)}>
          <Plus className="me-2 h-5 w-5" />
          {p.addProgressTitle}
        </Button>
      </div>

      <div className="hidden sm:block">
        <Button 
          className="fixed bottom-8 right-8 h-14 rounded-full px-6 shadow-lg hover:shadow-xl dark:shadow-zinc-900/50 z-40"
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
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{p.yearLabel}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={inputYear}
                    onChange={(e) => setInputYear(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{p.monthLabel}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={inputMonth}
                    onChange={(e) => setInputMonth(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                {activeAssets.map(assetKey => {
                  const label = assetClasses[assetKey] || assetKey;
                  const vals = assetInputs[assetKey] || { contribution: "", totalValue: "" };
                  return (
                    <div key={assetKey} className="space-y-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900/50">
                      <Label className="text-sm font-semibold">{label}</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-zinc-500">{p.contributionLabel}</Label>
                          <Input
                            inputMode="numeric"
                            placeholder="0"
                            value={vals.contribution || ""}
                            onChange={e => updateAssetInput(assetKey, "contribution", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-zinc-500">{p.totalValueLabel}</Label>
                          <Input
                            inputMode="numeric"
                            placeholder="0"
                            value={vals.totalValue || ""}
                            onChange={e => updateAssetInput(assetKey, "totalValue", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">{p.overallTotalLabel} {p.contributionLabel}</span>
                  <span className="font-medium tabular-nums">{formatTomanCompact(totalContribution, locale)} {p.toman}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">{p.overallTotalLabel} {p.totalValueLabel}</span>
                  <span className="font-medium tabular-nums">{formatTomanCompact(totalValue, locale)} {p.toman}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={
                  totalContribution === 0 && totalValue === 0 || saveState === "saving"
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

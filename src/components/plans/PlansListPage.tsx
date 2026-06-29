"use client";

import { Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { formatTomanCompact, formatYears } from "@/lib/freedom-format";
import { cn } from "@/lib/utils";

type SavedPlan = {
  id: string;
  monthlyExpense: number;
  targetCapital: number;
  yearsToFreedom: number;
  createdAt: string;
};

type PlansListPageProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function PlansListPage({ locale, dictionary }: PlansListPageProps) {
  const c = dictionary.calculator;
  const h = dictionary.home;
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      const [plansRes, selectedRes] = await Promise.all([
        fetch("/api/plans"),
        fetch(`/api/user/selected-plan?locale=${locale}`),
      ]);

      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.plans);
      }

      if (selectedRes.ok) {
        const data = await selectedRes.json();
        setSelectedPlanId(data.selectedPlanId ?? null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  async function deletePlan(planId: string) {
    if (!confirm(c.deletePlanConfirm)) return;

    setDeletingId(planId);
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: "DELETE" });
      if (res.ok) {
        setPlans((current) => current.filter((plan) => plan.id !== planId));
        if (selectedPlanId === planId) {
          setSelectedPlanId(null);
        }
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function setActivePlan(planId: string) {
    setSelectingId(planId);
    try {
      const res = await fetch("/api/user/selected-plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      if (res.ok) {
        setSelectedPlanId(planId);
      }
    } finally {
      setSelectingId(null);
    }
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{dictionary.nav.plans}</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{c.historyTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : plans.length === 0 ? (
            <p className="text-sm text-zinc-500">{c.noHistory}</p>
          ) : (
            <ul className="space-y-2">
              {plans.map((plan) => {
                const isActive = plan.id === selectedPlanId;

                return (
                  <li key={plan.id} className="flex items-stretch gap-2">
                    <Link
                      href={`/${locale}/plans/${plan.id}`}
                      className="flex min-w-0 flex-1 items-center justify-between rounded-lg border p-4 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    >
                      <span className="flex items-center gap-2 tabular-nums">
                        {isActive && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            {h.activePlanBadge}
                          </span>
                        )}
                        {formatTomanCompact(plan.monthlyExpense, locale)} {c.toman}/mo
                      </span>
                      <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatYears(plan.yearsToFreedom, locale)} {c.yearsUnit}
                        {" →"}
                      </span>
                    </Link>
                    <button
                      type="button"
                      aria-label={h.setActivePlan}
                      disabled={selectingId === plan.id || isActive}
                      onClick={() => void setActivePlan(plan.id)}
                      className={cn(
                        "inline-flex shrink-0 items-center justify-center rounded-lg border px-3 transition-colors disabled:opacity-50",
                        isActive
                          ? "border-amber-200 text-amber-500 dark:border-amber-900"
                          : "border-zinc-200 text-zinc-500 hover:bg-amber-50 hover:text-amber-600 dark:border-zinc-800 dark:hover:bg-amber-950/30 dark:hover:text-amber-400",
                      )}
                    >
                      <Star className={cn("size-4", isActive && "fill-current")} />
                    </button>
                    <button
                      type="button"
                      aria-label={c.deletePlan}
                      disabled={deletingId === plan.id}
                      onClick={() => void deletePlan(plan.id)}
                      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-zinc-200 px-3 text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-zinc-800 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

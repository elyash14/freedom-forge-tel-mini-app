"use client";

import { ChevronRight, List, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { PageHeader } from "@/components/ui/page-header";

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
    <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-5 px-4 py-6 pb-24">
      <PageHeader
        icon={List}
        title={dictionary.nav.plans}
        subtitle={c.historyTitle}
      />

      {isLoading ? (
        <p className="py-12 text-center text-sm text-zinc-500">Loading...</p>
      ) : plans.length === 0 ? (
        <section className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--tg-theme-secondary-bg-color,var(--border))] px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--tg-theme-secondary-bg-color,var(--muted))]">
            <List className="h-7 w-7 text-zinc-400" />
          </div>
          <p className="text-sm text-zinc-500">{c.noHistory}</p>
          <Link
            href={`/${locale}/calculator`}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--tg-theme-button-color,var(--primary))] px-4 py-2 text-sm font-medium text-[var(--tg-theme-button-text-color,var(--primary-foreground))]"
          >
            {h.startCalculating}
          </Link>
        </section>
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => {
            const isActive = plan.id === selectedPlanId;

            return (
              <li
                key={plan.id}
                className={cn(
                  "relative overflow-hidden rounded-2xl transition-colors",
                  isActive
                    ? "bg-gradient-to-br from-[#6C9BCF]/15 via-emerald-500/10 to-[#E8B86D]/10 ring-2 ring-[var(--tg-theme-button-color,var(--primary))]/30"
                    : "bg-[var(--tg-theme-section-bg-color,var(--card))]",
                )}
              >
                <div className="absolute end-2 top-2 z-10 flex gap-1">
                  <button
                    type="button"
                    aria-label={h.setActivePlan}
                    disabled={selectingId === plan.id || isActive}
                    onClick={() => void setActivePlan(plan.id)}
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors disabled:opacity-50",
                      isActive
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-black/5 text-zinc-500 hover:bg-amber-500/15 hover:text-amber-600 dark:bg-white/10 dark:hover:text-amber-400",
                    )}
                  >
                    <Star
                      className={cn("size-4", isActive && "fill-current")}
                    />
                  </button>
                  <button
                    type="button"
                    aria-label={c.deletePlan}
                    disabled={deletingId === plan.id}
                    onClick={() => void deletePlan(plan.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/5 text-zinc-500 transition-colors hover:bg-red-500/15 hover:text-red-600 disabled:opacity-50 dark:bg-white/10 dark:hover:text-red-400"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                <Link
                  href={`/${locale}/plans/${plan.id}`}
                  className="flex items-center justify-between gap-3 p-4 pe-24 transition-opacity hover:opacity-90"
                >
                  <div className="min-w-0">
                    {isActive && (
                      <span className="mb-1.5 inline-flex rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                        {h.activePlanBadge}
                      </span>
                    )}
                    <p className="font-medium tabular-nums">
                      {formatTomanCompact(plan.monthlyExpense, locale)}{" "}
                      {c.toman}/mo
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {h.targetCapital}:{" "}
                      <span className="tabular-nums">
                        {formatTomanCompact(plan.targetCapital, locale)}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-end font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatYears(plan.yearsToFreedom, locale)}
                      <span className="ms-1 text-xs font-normal text-zinc-500">
                        {c.yearsUnit}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

"use client";

import { Trash2 } from "lucide-react";
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
import { formatToman, formatYears } from "@/lib/freedom-format";

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
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      }
    } finally {
      setDeletingId(null);
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
              {plans.map((plan) => (
                <li key={plan.id} className="flex items-stretch gap-2">
                  <Link
                    href={`/${locale}/plans/${plan.id}`}
                    className="flex min-w-0 flex-1 items-center justify-between rounded-lg border p-4 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <span className="tabular-nums">
                      {formatToman(plan.monthlyExpense, locale)} {c.toman}/mo
                    </span>
                    <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatYears(plan.yearsToFreedom, locale)} {c.yearsUnit}
                      {" →"}
                    </span>
                  </Link>
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
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

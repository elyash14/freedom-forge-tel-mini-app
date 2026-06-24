"use client";

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
                <li key={plan.id}>
                  <Link
                    href={`/${locale}/plans/${plan.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  >
                    <span className="tabular-nums">
                      {formatToman(plan.monthlyExpense, locale)} {c.toman}/mo
                    </span>
                    <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatYears(plan.yearsToFreedom, locale)} {c.yearsUnit}
                      {" →"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

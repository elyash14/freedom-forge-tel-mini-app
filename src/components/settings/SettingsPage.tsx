"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

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
import { formatPercent } from "@/lib/freedom-format";

type AssetClassDto = {
  id: string;
  key: string;
  labelFa: string;
  labelEn: string;
  historicalNominalReturn: number;
};

type SettingsPageProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function SettingsPage({ locale, dictionary }: SettingsPageProps) {
  const s = dictionary.settings;
  const [inflationRate, setInflationRate] = useState(0.45);
  const [assetClasses, setAssetClasses] = useState<AssetClassDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const [configRes, assetsRes] = await Promise.all([
        fetch("/api/config"),
        fetch("/api/asset-classes"),
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
      setLoadError(null);
    } catch {
      setLoadError(s.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [s.loadError]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function updateAsset(
    id: string,
    field: "labelFa" | "labelEn" | "historicalNominalReturn",
    value: string,
  ) {
    setAssetClasses((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "historicalNominalReturn"
                  ? Number(value) || 0
                  : value,
            }
          : item,
      ),
    );
  }

  async function saveSettings() {
    setSaveState("saving");
    setSaveError(null);

    try {
      const [configRes, assetsRes] = await Promise.all([
        fetch("/api/config", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ defaultInflationRate: inflationRate }),
        }),
        fetch("/api/asset-classes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetClasses }),
        }),
      ]);

      if (!configRes.ok || !assetsRes.ok) {
        throw new Error("save failed");
      }

      const updated = (await assetsRes.json()) as AssetClassDto[];
      setAssetClasses(updated);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveError(s.saveError);
      setSaveState("idle");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 text-center sm:text-start">
            <h1 className="text-3xl font-bold tracking-tight">{s.title}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">{s.subtitle}</p>
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
          {s.backToCalculator}
        </Link>
      </header>

      {loadError && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {loadError}
        </p>
      )}

      {saveError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          {saveError}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{s.inflationSection}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <Label>{s.inflationRate}</Label>
            <span className="text-sm font-medium">
              {formatPercent(inflationRate, locale)}
            </span>
          </div>
          <Slider
            min={0.05}
            max={1}
            step={0.01}
            value={[inflationRate]}
            onValueChange={(v) => setInflationRate(v[0] ?? 0.45)}
            disabled={isLoading}
          />
          <p className="text-xs text-zinc-500">{s.inflationHint}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{s.assetsSection}</CardTitle>
          <CardDescription>{s.assetsHint}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {assetClasses.map((asset) => (
            <div
              key={asset.id}
              className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {asset.key}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">{s.labelFa}</Label>
                  <Input
                    value={asset.labelFa}
                    onChange={(e) =>
                      updateAsset(asset.id, "labelFa", e.target.value)
                    }
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{s.labelEn}</Label>
                  <Input
                    value={asset.labelEn}
                    onChange={(e) =>
                      updateAsset(asset.id, "labelEn", e.target.value)
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{s.nominalReturn}</Label>
                <Input
                  inputMode="decimal"
                  value={asset.historicalNominalReturn}
                  onChange={(e) =>
                    updateAsset(
                      asset.id,
                      "historicalNominalReturn",
                      e.target.value,
                    )
                  }
                  disabled={isLoading}
                />
                <p className="text-xs text-zinc-500">
                  {formatPercent(asset.historicalNominalReturn, locale)} — decimal e.g. 0.35 = 35%
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button
        type="button"
        className="w-full"
        disabled={isLoading || saveState === "saving"}
        onClick={() => void saveSettings()}
      >
        {saveState === "saving"
          ? s.saving
          : saveState === "saved"
            ? s.saved
            : s.save}
      </Button>
    </div>
  );
}

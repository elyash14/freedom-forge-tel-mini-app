"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { formatHistoricalYear } from "@/lib/freedom-format";
import {
  ASSET_KEY_TO_HISTORICAL_COLUMN,
  type HistoricalReturnAssetColumn,
  type HistoricalReturnRow,
  type PortfolioAssetKey,
} from "@/lib/historical-returns";

type AssetClassDto = {
  id: string;
  key: string;
  labelFa: string;
  labelEn: string;
};

type MainSettingsTab = "assets" | "historical";
type HistoricalDataTab = "inflation" | PortfolioAssetKey;

type SettingsPageProps = {
  locale: Locale;
  dictionary: Dictionary;
};

const INFLATION_TAB: HistoricalDataTab = "inflation";

function assetLabel(asset: AssetClassDto, locale: Locale): string {
  return locale === "fa" ? asset.labelFa : asset.labelEn;
}

function isPortfolioAssetKey(key: string): key is PortfolioAssetKey {
  return key in ASSET_KEY_TO_HISTORICAL_COLUMN;
}

function decimalToPercentInput(value: number | null): string {
  if (value == null) {
    return "";
  }

  const percent = value * 100;
  const rounded = Math.round(percent * 100) / 100;

  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function percentInputToDecimal(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed || trimmed === "—") {
    return null;
  }

  const parsed = Number(trimmed.replace(/,/g, ""));

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed / 100;
}

function isPartialPercentInput(value: string): boolean {
  return /^-?$|^-?\d*\.?\d*$/.test(value.trim());
}

function historicalInputKey(
  year: number,
  field: keyof HistoricalReturnRow,
): string {
  return `${year}:${field}`;
}

export function SettingsPage({ locale, dictionary }: SettingsPageProps) {
  const s = dictionary.settings;
  const [assetClasses, setAssetClasses] = useState<AssetClassDto[]>([]);
  const [historicalReturns, setHistoricalReturns] = useState<
    HistoricalReturnRow[]
  >([]);
  const [mainTab, setMainTab] = useState<MainSettingsTab>("assets");
  const [historicalTab, setHistoricalTab] =
    useState<HistoricalDataTab>(INFLATION_TAB);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingInputs, setPendingInputs] = useState<Record<string, string>>(
    {},
  );

  const portfolioAssets = useMemo(
    () => assetClasses.filter((asset) => isPortfolioAssetKey(asset.key)),
    [assetClasses],
  );

  const loadSettings = useCallback(async () => {
    try {
      const [assetsRes, historicalRes] = await Promise.all([
        fetch("/api/asset-classes"),
        fetch("/api/historical-returns"),
      ]);

      if (!assetsRes.ok || !historicalRes.ok) {
        throw new Error("load failed");
      }

      setAssetClasses((await assetsRes.json()) as AssetClassDto[]);
      setHistoricalReturns(
        (await historicalRes.json()) as HistoricalReturnRow[],
      );
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
    field: "labelFa" | "labelEn",
    value: string,
  ) {
    setAssetClasses((items) =>
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  function updateHistoricalField(
    year: number,
    field: keyof HistoricalReturnRow,
    rawValue: string,
    nullable = false,
  ) {
    const key = historicalInputKey(year, field);

    setPendingInputs((pending) => ({ ...pending, [key]: rawValue }));

    setHistoricalReturns((rows) =>
      rows.map((row) => {
        if (row.year !== year) {
          return row;
        }

        if (nullable && rawValue.trim() === "") {
          return { ...row, [field]: null };
        }

        const decimal = percentInputToDecimal(rawValue);

        if (decimal == null) {
          if (isPartialPercentInput(rawValue)) {
            return row;
          }

          return row;
        }

        return { ...row, [field]: decimal };
      }),
    );
  }

  function commitHistoricalField(
    year: number,
    field: keyof HistoricalReturnRow,
    rawValue: string,
    nullable = false,
  ) {
    const key = historicalInputKey(year, field);

    setPendingInputs((pending) => {
      const next = { ...pending };
      delete next[key];
      return next;
    });

    setHistoricalReturns((rows) =>
      rows.map((row) => {
        if (row.year !== year) {
          return row;
        }

        if (nullable && rawValue.trim() === "") {
          return { ...row, [field]: null };
        }

        const decimal = percentInputToDecimal(rawValue);

        if (decimal == null) {
          return row;
        }

        return { ...row, [field]: decimal };
      }),
    );
  }

  function getHistoricalFieldValue(
    row: HistoricalReturnRow,
    field: keyof HistoricalReturnRow,
  ): string {
    const key = historicalInputKey(row.year, field);
    if (key in pendingInputs) {
      return pendingInputs[key];
    }

    const value = row[field];

    if (typeof value === "number") {
      return decimalToPercentInput(value);
    }

    return "";
  }

  async function saveSettings() {
    setSaveState("saving");
    setSaveError(null);

    try {
      const [assetsRes, historicalRes] = await Promise.all([
        fetch("/api/asset-classes", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetClasses }),
        }),
        fetch("/api/historical-returns", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: historicalReturns }),
        }),
      ]);

      if (!assetsRes.ok || !historicalRes.ok) {
        throw new Error("save failed");
      }

      setAssetClasses((await assetsRes.json()) as AssetClassDto[]);
      setHistoricalReturns(
        (await historicalRes.json()) as HistoricalReturnRow[],
      );
      setPendingInputs({});
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2000);
    } catch {
      setSaveError(s.saveError);
      setSaveState("idle");
    }
  }

  function renderRateTable(
    field: keyof HistoricalReturnRow,
    nullable = false,
  ) {
    return (
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-b bg-zinc-50 text-start text-xs text-zinc-500 dark:bg-zinc-900/50">
              <th className="w-24 px-3 py-2">{s.colYear}</th>
              <th className="px-3 py-2">{s.colAnnualReturn}</th>
            </tr>
          </thead>
          <tbody>
            {historicalReturns.map((row) => (
              <tr
                key={row.year}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
              >
                <td className="px-3 py-2 tabular-nums font-medium">
                  <span dir="ltr">
                    {formatHistoricalYear(row.year, locale)}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <Input
                    inputMode="decimal"
                    className="h-9 max-w-[160px] tabular-nums"
                    placeholder={nullable ? s.emptyValue : "0"}
                    value={getHistoricalFieldValue(row, field)}
                    onChange={(e) =>
                      updateHistoricalField(
                        row.year,
                        field,
                        e.target.value,
                        nullable,
                      )
                    }
                    onBlur={(e) =>
                      commitHistoricalField(
                        row.year,
                        field,
                        e.target.value,
                        nullable,
                      )
                    }
                    disabled={isLoading}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{s.title}</h1>
        <p className="text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))]">{s.subtitle}</p>
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
        <CardContent className="pt-6">
          <Tabs
            value={mainTab}
            onValueChange={(value) => setMainTab(value as MainSettingsTab)}
          >
            <TabsList
              aria-label={s.title}
              className="mb-6 grid w-full grid-cols-2 gap-1 p-1.5"
            >
              <TabsTrigger
                value="assets"
                className="py-2.5 text-sm sm:text-base"
              >
                {s.mainTabAssetClasses}
              </TabsTrigger>
              <TabsTrigger
                value="historical"
                className="py-2.5 text-sm sm:text-base"
              >
                {s.mainTabHistoricalData}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="assets" className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{s.assetsSection}</h2>
                <p className="text-sm text-zinc-500">{s.assetsHint}</p>
              </div>

              <div className="space-y-3">
                {assetClasses.map((asset) => (
                  <div
                    key={asset.id}
                    className="space-y-3 rounded-lg border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-secondary-bg-color,var(--muted))] p-4"
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
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="historical" className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{s.historicalSection}</h2>
                <p className="text-sm text-zinc-500">{s.historicalHint}</p>
              </div>

              <div className="min-w-0 rounded-xl border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-secondary-bg-color,var(--muted))] p-3 sm:p-4">
                <Tabs
                  value={historicalTab}
                  onValueChange={(value) =>
                    setHistoricalTab(value as HistoricalDataTab)
                  }
                >
                  <TabsList
                    aria-label={s.historicalSection}
                    className="mb-4"
                  >
                    <TabsTrigger value={INFLATION_TAB}>
                      {s.historicalTabInflation}
                    </TabsTrigger>
                    {portfolioAssets.map((asset) => (
                      <TabsTrigger key={asset.id} value={asset.key}>
                        {assetLabel(asset, locale)}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value={INFLATION_TAB} className="space-y-3">
                    <p className="text-xs text-zinc-500">{s.returnRateHint}</p>
                    {renderRateTable("inflation")}
                  </TabsContent>

                  {portfolioAssets.map((asset) => {
                    const column = ASSET_KEY_TO_HISTORICAL_COLUMN[
                      asset.key as PortfolioAssetKey
                    ] as HistoricalReturnAssetColumn;
                    const nullable = column === "crypto";

                    return (
                      <TabsContent
                        key={asset.id}
                        value={asset.key}
                        className="space-y-3"
                      >
                        <p className="text-xs text-zinc-500">
                          {nullable ? s.nullableReturnHint : s.returnRateHint}
                        </p>
                        {renderRateTable(column, nullable)}
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </div>
            </TabsContent>
          </Tabs>
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

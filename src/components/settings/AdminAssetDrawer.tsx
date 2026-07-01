"use client";

import { useEffect, useMemo, useState } from "react";

import {
  assetLabel,
  decimalToPercentInput,
  historicalInputKey,
  isPartialPercentInput,
  percentInputToDecimal,
  type AssetClassDto,
} from "@/components/settings/settings-utils";
import { Button } from "@/components/ui/button";
import { ColorInput } from "@/components/ui/color-input";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import { SegmentControl } from "@/components/ui/segment-control";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { formatHistoricalYear } from "@/lib/freedom-format";
import {
  ASSET_KEY_TO_HISTORICAL_COLUMN,
  type HistoricalReturnRow,
  type PortfolioAssetKey,
} from "@/lib/historical-returns";

export type AdminDrawerTarget =
  | { kind: "inflation" }
  | { kind: "asset"; asset: AssetClassDto };

type AdminAssetDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: AdminDrawerTarget | null;
  locale: Locale;
  dictionary: Dictionary;
  historicalReturns: HistoricalReturnRow[];
  onAssetSaved: (asset: AssetClassDto) => void;
  onHistoricalSaved: (rows: HistoricalReturnRow[]) => void;
};

function isPortfolioAssetKey(key: string): key is PortfolioAssetKey {
  return key in ASSET_KEY_TO_HISTORICAL_COLUMN;
}

type DrawerView = "details" | "history";

export function AdminAssetDrawer({
  open,
  onOpenChange,
  target,
  locale,
  dictionary,
  historicalReturns,
  onAssetSaved,
  onHistoricalSaved,
}: AdminAssetDrawerProps) {
  const s = dictionary.settings;
  const isInflation = target?.kind === "inflation";

  const [view, setView] = useState<DrawerView>("details");
  const [labelFa, setLabelFa] = useState("");
  const [labelEn, setLabelEn] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [rows, setRows] = useState<HistoricalReturnRow[]>([]);
  const [pendingInputs, setPendingInputs] = useState<Record<string, string>>(
    {},
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  const historyField = useMemo((): keyof HistoricalReturnRow | null => {
    if (!target || target.kind === "inflation") {
      return "inflation";
    }

    if (!isPortfolioAssetKey(target.asset.key)) {
      return null;
    }

    return ASSET_KEY_TO_HISTORICAL_COLUMN[target.asset.key];
  }, [target]);

  const historyNullable =
    historyField != null &&
    historyField !== "inflation" &&
    historyField !== "year";

  useEffect(() => {
    if (!open || !target) {
      return;
    }

    setView(isInflation ? "history" : "details");
    setPendingInputs({});
    setRows(historicalReturns);
    setSaveState("idle");
    setError(null);

    if (target.kind === "asset") {
      setLabelFa(target.asset.labelFa);
      setLabelEn(target.asset.labelEn);
      setColor(target.asset.color);
    }
  }, [open, target, isInflation, historicalReturns]);

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

  function updateHistoricalField(
    year: number,
    field: keyof HistoricalReturnRow,
    rawValue: string,
  ) {
    const key = historicalInputKey(year, field);

    setPendingInputs((pending) => ({ ...pending, [key]: rawValue }));

    setRows((current) =>
      current.map((row) => {
        if (row.year !== year) {
          return row;
        }

        if (historyNullable && rawValue.trim() === "") {
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
  ) {
    const key = historicalInputKey(year, field);

    setPendingInputs((pending) => {
      const next = { ...pending };
      delete next[key];
      return next;
    });

    setRows((current) =>
      current.map((row) => {
        if (row.year !== year) {
          return row;
        }

        if (historyNullable && rawValue.trim() === "") {
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

  async function saveDetails() {
    if (!target || target.kind !== "asset") {
      return;
    }

    setSaveState("saving");
    setError(null);

    try {
      const payload = {
        id: target.asset.id,
        labelFa: labelFa.trim(),
        labelEn: labelEn.trim(),
        color,
      };

      const res = await fetch("/api/asset-classes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetClasses: [payload] }),
      });

      if (!res.ok) {
        throw new Error("save failed");
      }

      const updated = (await res.json()) as AssetClassDto[];
      const saved = updated.find((item) => item.id === target.asset.id);

      if (saved) {
        onAssetSaved(saved);
      }

      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setError(s.saveError);
      setSaveState("idle");
    }
  }

  async function saveHistory() {
    setSaveState("saving");
    setError(null);

    try {
      const res = await fetch("/api/historical-returns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      if (!res.ok) {
        throw new Error("save failed");
      }

      const updated = (await res.json()) as HistoricalReturnRow[];
      onHistoricalSaved(updated);
      setPendingInputs({});
      setRows(updated);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1500);
    } catch {
      setError(s.saveError);
      setSaveState("idle");
    }
  }

  async function handleSave() {
    if (view === "details") {
      await saveDetails();
      return;
    }

    await saveHistory();
  }

  const title =
    target?.kind === "inflation"
      ? s.historicalTabInflation
      : target?.kind === "asset"
        ? assetLabel(target.asset, locale)
        : "";

  const columnLabel =
    historyField === "inflation" ? s.colInflation : s.colAnnualReturn;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="text-start">
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-2">
          {!isInflation && (
            <SegmentControl
              value={view}
              onChange={setView}
              ariaLabel={title}
              options={[
                { value: "details", label: s.drawerDetailsTab },
                { value: "history", label: s.drawerHistoryTab },
              ]}
            />
          )}

          {view === "details" && target?.kind === "asset" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-label-fa">{s.labelFa}</Label>
                <Input
                  id="admin-label-fa"
                  value={labelFa}
                  onChange={(e) => setLabelFa(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-label-en">{s.labelEn}</Label>
                <Input
                  id="admin-label-en"
                  value={labelEn}
                  onChange={(e) => setLabelEn(e.target.value)}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>{s.assetColor}</Label>
                <ColorInput value={color} onChange={setColor} />
              </div>
            </div>
          )}

          {view === "history" && historyField && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
                {historyNullable ? s.nullableReturnHint : s.returnRateHint}
              </p>
              <div className="overflow-x-auto rounded-xl bg-[var(--tg-theme-secondary-bg-color,var(--muted))]/40">
                <table className="w-full min-w-[280px] text-sm">
                  <thead>
                    <tr className="border-b border-[var(--tg-theme-secondary-bg-color,var(--border))] text-start text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
                      <th className="w-24 px-3 py-2">{s.colYear}</th>
                      <th className="px-3 py-2">{columnLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.year}
                        className="border-b border-[var(--tg-theme-secondary-bg-color,var(--border))]/60 last:border-0"
                      >
                        <td className="px-3 py-2 tabular-nums font-medium">
                          <span dir="ltr">
                            {formatHistoricalYear(row.year, locale)}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <NumericInput
                            locale={locale}
                            kind="percent"
                            className="h-9 max-w-[160px]"
                            placeholder={
                              historyNullable ? s.emptyValue : "0"
                            }
                            value={getHistoricalFieldValue(row, historyField)}
                            onChange={(value) =>
                              updateHistoricalField(row.year, historyField, value)
                            }
                            onBlur={(e) =>
                              commitHistoricalField(
                                row.year,
                                historyField,
                                e.target.value,
                              )
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
        </div>

        <DrawerFooter>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveState === "saving"}
          >
            {saveState === "saving"
              ? s.saving
              : saveState === "saved"
                ? s.saved
                : s.save}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

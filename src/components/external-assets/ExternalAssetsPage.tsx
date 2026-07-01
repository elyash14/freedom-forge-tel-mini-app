"use client";

import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { NumericInput } from "@/components/ui/numeric-input";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import {
  customPortfolioKey,
  isCustomPortfolioKey,
} from "@/lib/custom-portfolios";
import type { ExternalHoldingDto } from "@/lib/external-holdings";
import { isFreeformExternalKey } from "@/lib/external-holdings";
import { formatTomanCompact } from "@/lib/freedom-format";
import { buildAssetColorMap, resolveAssetColor } from "@/lib/asset-colors";
import { parseLocalizedNumber } from "@/lib/numeric-input";
import { cn } from "@/lib/utils";

type BasketOption = {
  assetKey: string;
  label: string;
  kind: "standard" | "custom";
};

type HoldingGroup = {
  id: "standard" | "custom" | "other";
  title: string;
  items: ExternalHoldingDto[];
};

type ExternalAssetsPageProps = {
  locale: Locale;
  dictionary: Dictionary;
};

type DrawerMode = "add" | "edit" | null;

export function ExternalAssetsPage({
  locale,
  dictionary,
}: ExternalAssetsPageProps) {
  const e = dictionary.externalAssets;
  const [holdings, setHoldings] = useState<ExternalHoldingDto[]>([]);
  const [standardBaskets, setStandardBaskets] = useState<BasketOption[]>([]);
  const [customBaskets, setCustomBaskets] = useState<BasketOption[]>([]);
  const [assetColors, setAssetColors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [editingHolding, setEditingHolding] = useState<ExternalHoldingDto | null>(
    null,
  );
  const [selectedBasketKey, setSelectedBasketKey] = useState<string | null>(null);
  const [drawerAmount, setDrawerAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [holdingsRes, assetClassesRes, customRes] = await Promise.all([
        fetch("/api/external-holdings"),
        fetch("/api/asset-classes"),
        fetch("/api/custom-portfolios"),
      ]);

      if (!holdingsRes.ok) {
        throw new Error("load failed");
      }

      const holdingsData = await holdingsRes.json();
      setHoldings((holdingsData.holdings ?? []) as ExternalHoldingDto[]);
      setLoadError(null);

      const assetClassesData = assetClassesRes.ok
        ? ((await assetClassesRes.json()) as {
            key: string;
            labelFa: string;
            labelEn: string;
            color: string;
          }[])
        : [];
      const customData = customRes?.ok
        ? ((await customRes.json()) as {
            portfolios: { id: string; name: string; color: string }[];
          })
        : { portfolios: [] };

      setStandardBaskets(
        assetClassesData.map((asset) => ({
          assetKey: asset.key,
          label: locale === "fa" ? asset.labelFa : asset.labelEn,
          kind: "standard" as const,
        })),
      );
      setCustomBaskets(
        customData.portfolios.map((portfolio) => ({
          assetKey: customPortfolioKey(portfolio.id),
          label: portfolio.name,
          kind: "custom" as const,
        })),
      );
      setAssetColors(
        buildAssetColorMap(
          assetClassesData.map((asset) => ({
            key: asset.key,
            color: asset.color,
          })),
          customData.portfolios.map((portfolio) => ({
            id: portfolio.id,
            color: portfolio.color,
          })),
        ),
      );
    } catch {
      setLoadError(e.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [e.loadError, locale]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const holdingsByKey = useMemo(
    () => new Map(holdings.map((holding) => [holding.assetKey, holding])),
    [holdings],
  );

  const allBaskets = useMemo(
    () => [...standardBaskets, ...customBaskets],
    [standardBaskets, customBaskets],
  );

  const availableBaskets = useMemo(
    () => allBaskets.filter((basket) => !holdingsByKey.has(basket.assetKey)),
    [allBaskets, holdingsByKey],
  );

  const availableStandard = useMemo(
    () => availableBaskets.filter((basket) => basket.kind === "standard"),
    [availableBaskets],
  );

  const availableCustom = useMemo(
    () => availableBaskets.filter((basket) => basket.kind === "custom"),
    [availableBaskets],
  );

  const totalBalance = useMemo(
    () => holdings.reduce((sum, holding) => sum + holding.totalValue, 0),
    [holdings],
  );

  const groupedHoldings = useMemo((): HoldingGroup[] => {
    const standard: ExternalHoldingDto[] = [];
    const custom: ExternalHoldingDto[] = [];
    const other: ExternalHoldingDto[] = [];

    for (const holding of holdings) {
      if (isFreeformExternalKey(holding.assetKey)) {
        other.push(holding);
      } else if (isCustomPortfolioKey(holding.assetKey)) {
        custom.push(holding);
      } else {
        standard.push(holding);
      }
    }

    const sortByValue = (items: ExternalHoldingDto[]) =>
      [...items].sort((a, b) => b.totalValue - a.totalValue);

    const groups: HoldingGroup[] = [
      { id: "standard", title: e.standardSection, items: sortByValue(standard) },
      { id: "custom", title: e.customSection, items: sortByValue(custom) },
      { id: "other", title: e.otherSection, items: sortByValue(other) },
    ];

    return groups.filter((group) => group.items.length > 0);
  }, [holdings, e.standardSection, e.customSection, e.otherSection]);

  function openAddDrawer() {
    setSaveError(null);
    setEditingHolding(null);
    setSelectedBasketKey(availableBaskets[0]?.assetKey ?? null);
    setDrawerAmount("");
    setDrawerMode("add");
  }

  function openEditDrawer(holding: ExternalHoldingDto) {
    setSaveError(null);
    setEditingHolding(holding);
    setSelectedBasketKey(holding.assetKey);
    setDrawerAmount(
      holding.totalValue > 0 ? String(holding.totalValue) : "",
    );
    setDrawerMode("edit");
  }

  function closeDrawer() {
    setDrawerMode(null);
    setEditingHolding(null);
    setSelectedBasketKey(null);
    setDrawerAmount("");
  }

  async function submitDrawer() {
    const totalValue = parseLocalizedNumber(drawerAmount) ?? 0;
    if (totalValue < 0) {
      return;
    }

    setSaveError(null);
    setIsSubmitting(true);

    try {
      if (drawerMode === "add") {
        const basket = allBaskets.find(
          (item) => item.assetKey === selectedBasketKey,
        );
        if (!basket) {
          return;
        }

        const res = await fetch(`/api/external-holdings?locale=${locale}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assetKey: basket.assetKey,
            name: basket.label,
            totalValue,
          }),
        });

        if (!res.ok) {
          throw new Error("create failed");
        }
      }

      if (drawerMode === "edit" && editingHolding) {
        const res = await fetch(
          `/api/external-holdings/${editingHolding.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ totalValue }),
          },
        );

        if (!res.ok) {
          throw new Error("save failed");
        }
      }

      closeDrawer();
      await loadData();
    } catch {
      setSaveError(e.saveError);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteHolding(id: string) {
    if (!window.confirm(e.deleteConfirm)) {
      return;
    }

    setSaveError(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/external-holdings/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("delete failed");
      }

      if (editingHolding?.id === id) {
        closeDrawer();
      }

      await loadData();
    } catch {
      setSaveError(e.saveError);
    } finally {
      setDeletingId(null);
    }
  }

  const canSubmitAdd =
    drawerMode === "add" &&
    selectedBasketKey != null &&
    (parseLocalizedNumber(drawerAmount) ?? 0) >= 0;

  const canSubmitEdit =
    drawerMode === "edit" &&
    editingHolding != null &&
    (parseLocalizedNumber(drawerAmount) ?? 0) >= 0;

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-zinc-500">Loading...</div>;
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-5 px-4 py-8 pb-24">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{e.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{e.subtitle}</p>
        </div>
        <Button
          type="button"
          className="h-10 shrink-0 gap-1.5 px-3"
          onClick={openAddDrawer}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{e.addAsset}</span>
        </Button>
      </header>

      {loadError && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {loadError}
        </p>
      )}

      {saveError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100">
          {saveError}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#6C9BCF]/15 via-[#7DD3C0]/10 to-[#E8B86D]/15 p-5 ring-1 ring-[var(--tg-theme-secondary-bg-color,var(--border))]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6C9BCF]/20 text-[#6C9BCF]">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-500">{e.totalBalance}</p>
            <p className="text-2xl font-bold tabular-nums tracking-tight">
              {formatTomanCompact(totalBalance, locale)}{" "}
              <span className="text-base font-medium text-zinc-500">
                {e.toman}
              </span>
            </p>
          </div>
        </div>
      </div>

      {holdings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--tg-theme-secondary-bg-color,var(--border))] px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
            <Wallet className="h-7 w-7 text-zinc-400" />
          </div>
          <div>
            <p className="font-medium">{e.emptyState}</p>
            <p className="mt-1 text-sm text-zinc-500">{e.emptyStateHint}</p>
          </div>
          <Button type="button" className="mt-2 gap-1.5" onClick={openAddDrawer}>
            <Plus className="h-4 w-4" />
            {e.addAsset}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedHoldings.map((group) => (
            <section key={group.id} className="space-y-2">
              <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {group.title}
              </h2>
              <div className="space-y-2">
                {group.items.map((holding) => {
                  const color = resolveAssetColor(holding.assetKey, assetColors);

                  return (
                    <div
                      key={holding.id}
                      className="flex items-center gap-3 rounded-2xl border border-[var(--tg-theme-secondary-bg-color,var(--border))] bg-[var(--tg-theme-section-bg-color,var(--card))] p-3.5"
                    >
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-3 text-start"
                        onClick={() => openEditDrawer(holding)}
                      >
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
                          <p className="truncate font-medium">{holding.name}</p>
                          <p className="mt-0.5 text-lg font-semibold tabular-nums">
                            {formatTomanCompact(holding.totalValue, locale)}{" "}
                            <span className="text-sm font-normal text-zinc-500">
                              {e.toman}
                            </span>
                          </p>
                        </div>
                        <Pencil className="h-4 w-4 shrink-0 text-zinc-400" />
                      </button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 w-10 shrink-0 px-0 text-red-500"
                        disabled={deletingId === holding.id}
                        onClick={() => void deleteHolding(holding.id)}
                        aria-label={e.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <Drawer
        open={drawerMode != null}
        onOpenChange={(open) => {
          if (!open) {
            closeDrawer();
          }
        }}
      >
        <DrawerContent className="mx-auto max-h-[85vh] sm:max-w-lg">
          <DrawerHeader className="text-start">
            <DrawerTitle>
              {drawerMode === "edit" ? e.editDrawerTitle : e.addDrawerTitle}
            </DrawerTitle>
          </DrawerHeader>

          <div className="space-y-5 overflow-y-auto px-4 pb-2">
            {drawerMode === "edit" && editingHolding && (
              <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900/50">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: `${resolveAssetColor(editingHolding.assetKey, assetColors)}22`,
                  }}
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: resolveAssetColor(
                        editingHolding.assetKey,
                        assetColors,
                      ),
                    }}
                  />
                </div>
                <p className="font-medium">{editingHolding.name}</p>
              </div>
            )}

            {drawerMode === "add" && (
              <div className="space-y-4">
                <p className="text-sm font-medium">{e.selectBasket}</p>

                {availableBaskets.length === 0 ? (
                  <p className="text-sm text-zinc-500">{e.noBasketsLeft}</p>
                ) : (
                  <>
                    {availableStandard.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-500">
                          {e.standardSection}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {availableStandard.map((basket) => (
                            <BasketChip
                              key={basket.assetKey}
                              basket={basket}
                              selected={selectedBasketKey === basket.assetKey}
                              colorMap={assetColors}
                              onSelect={() =>
                                setSelectedBasketKey(basket.assetKey)
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {availableCustom.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-500">
                          {e.customSection}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {availableCustom.map((basket) => (
                            <BasketChip
                              key={basket.assetKey}
                              basket={basket}
                              selected={selectedBasketKey === basket.assetKey}
                              colorMap={assetColors}
                              onSelect={() =>
                                setSelectedBasketKey(basket.assetKey)
                              }
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">{e.totalValue}</Label>
              <NumericInput
                locale={locale}
                kind="money"
                unitLabel={e.toman}
                value={drawerAmount}
                onChange={setDrawerAmount}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DrawerFooter className="gap-2">
            {drawerMode === "edit" && editingHolding && (
              <Button
                type="button"
                variant="outline"
                className="w-full text-red-500"
                disabled={isSubmitting || deletingId === editingHolding.id}
                onClick={() => void deleteHolding(editingHolding.id)}
              >
                {e.delete}
              </Button>
            )}
            <Button
              type="button"
              className="w-full"
              disabled={
                isSubmitting ||
                (drawerMode === "add" && !canSubmitAdd) ||
                (drawerMode === "edit" && !canSubmitEdit)
              }
              onClick={() => void submitDrawer()}
            >
              {isSubmitting
                ? e.saving
                : drawerMode === "edit"
                  ? e.update
                  : e.create}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function BasketChip({
  basket,
  selected,
  onSelect,
  colorMap,
}: {
  basket: BasketOption;
  selected: boolean;
  onSelect: () => void;
  colorMap: Record<string, string>;
}) {
  const color = resolveAssetColor(basket.assetKey, colorMap);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 rounded-xl border p-3 text-start text-sm transition-colors",
        selected
          ? "border-[var(--tg-theme-link-color,var(--primary))] bg-[var(--tg-theme-link-color,var(--primary))]/10"
          : "border-[var(--tg-theme-secondary-bg-color,var(--border))] hover:bg-zinc-50 dark:hover:bg-zinc-900/50",
      )}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}22` }}
      >
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="line-clamp-2 font-medium leading-snug">
        {basket.label}
      </span>
    </button>
  );
}

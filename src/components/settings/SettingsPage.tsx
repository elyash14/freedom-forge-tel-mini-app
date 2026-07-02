"use client";

import { ChevronLeft, Plus, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AdminAssetDrawer,
  type AdminDrawerTarget,
} from "@/components/settings/AdminAssetDrawer";
import { PersonalAssetDrawer } from "@/components/settings/PersonalAssetDrawer";
import {
  assetLabel,
  decimalToPercentInput,
  type AssetClassDto,
} from "@/components/settings/settings-utils";
import { PageHeader } from "@/components/ui/page-header";
import { useAppPreferences } from "@/components/preferences/app-preferences-provider";
import { useTelegram } from "@/components/telegram/telegram-provider";
import { Button } from "@/components/ui/button";
import { SegmentControl } from "@/components/ui/segment-control";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/types";
import { useUserAccess } from "@/hooks/use-user-access";
import { setLocaleCookie, type AppTheme } from "@/lib/app-preferences";
import type { CustomAssetDto } from "@/lib/custom-assets";
import {
  ASSET_KEY_TO_HISTORICAL_COLUMN,
  type HistoricalReturnRow,
  type PortfolioAssetKey,
} from "@/lib/historical-returns";

type SettingsPageProps = {
  locale: Locale;
  dictionary: Dictionary;
  serverIsAdmin: boolean;
};

type SettingsTab = "appearance" | "personal" | "admin";

function isPortfolioAssetKey(key: string): key is PortfolioAssetKey {
  return key in ASSET_KEY_TO_HISTORICAL_COLUMN;
}

function SettingsRow({
  title,
  subtitle,
  color,
  onClick,
}: {
  title: string;
  subtitle?: string;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl bg-[var(--tg-theme-secondary-bg-color,var(--muted))]/50 px-4 py-3 text-start transition-colors hover:bg-[var(--tg-theme-secondary-bg-color,var(--muted))]"
    >
      {color && (
        <span
          className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/10"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        {subtitle && (
          <span className="block truncate text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
            {subtitle}
          </span>
        )}
      </span>
      <ChevronLeft className="h-4 w-4 shrink-0 rotate-180 text-[var(--tg-theme-hint-color,var(--muted-foreground))]" />
    </button>
  );
}

export function SettingsPage({
  locale,
  dictionary,
  serverIsAdmin,
}: SettingsPageProps) {
  const s = dictionary.settings;
  const d = dictionary.language;
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useAppPreferences();
  const { isAuthenticated, isAdmin: contextIsAdmin } = useTelegram();
  const { access: clientAccess } = useUserAccess();

  const isAdmin = serverIsAdmin || contextIsAdmin || clientAccess.isAdmin;

  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [assetClasses, setAssetClasses] = useState<AssetClassDto[]>([]);
  const [historicalReturns, setHistoricalReturns] = useState<
    HistoricalReturnRow[]
  >([]);
  const [customAssets, setCustomAssets] = useState<CustomAssetDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [adminDrawerOpen, setAdminDrawerOpen] = useState(false);
  const [adminTarget, setAdminTarget] = useState<AdminDrawerTarget | null>(
    null,
  );

  const [personalDrawerOpen, setPersonalDrawerOpen] = useState(false);
  const [editingPersonalAsset, setEditingPersonalAsset] =
    useState<CustomAssetDto | null>(null);

  const portfolioAssets = useMemo(
    () => assetClasses.filter((asset) => isPortfolioAssetKey(asset.key)),
    [assetClasses],
  );

  const loadSettings = useCallback(async () => {
    try {
      const requests: Promise<Response>[] = [
        fetch("/api/asset-classes"),
        fetch("/api/historical-returns"),
      ];

      if (isAuthenticated) {
        requests.push(fetch("/api/custom-assets"));
      }

      const [assetsRes, historicalRes, customRes] = await Promise.all(requests);

      if (!assetsRes.ok || !historicalRes.ok) {
        throw new Error("load failed");
      }

      setAssetClasses((await assetsRes.json()) as AssetClassDto[]);
      setHistoricalReturns(
        (await historicalRes.json()) as HistoricalReturnRow[],
      );

      if (customRes?.ok) {
        const data = (await customRes.json()) as {
          assets: CustomAssetDto[];
        };
        setCustomAssets(data.assets);
      } else {
        setCustomAssets([]);
      }

      setLoadError(null);
    } catch {
      setLoadError(s.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, s.loadError]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (!isAdmin && activeTab === "admin") {
      setActiveTab("appearance");
    }
  }, [isAdmin, activeTab]);

  async function changeLocale(nextLocale: Locale) {
    if (nextLocale === locale) {
      return;
    }

    setLocaleCookie(nextLocale);

    if (isAuthenticated) {
      void fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ locale: nextLocale }),
      });
    }

    const nextPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
    router.push(nextPath);
  }

  function openAdminDrawer(target: AdminDrawerTarget) {
    setAdminTarget(target);
    setAdminDrawerOpen(true);
  }

  function openPersonalDrawer(asset: CustomAssetDto | null) {
    setEditingPersonalAsset(asset);
    setPersonalDrawerOpen(true);
  }

  const themeOptions: { value: AppTheme; label: string }[] = [
    { value: "telegram", label: s.themeTelegram },
    { value: "light", label: s.themeLight },
    { value: "dark", label: s.themeDark },
    { value: "system", label: s.themeSystem },
  ];

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-6">
      <PageHeader
        icon={Settings}
        title={s.title}
        subtitle={s.subtitle}
      />

      {loadError && (
        <p className="text-sm text-red-500" role="alert">
          {loadError}
        </p>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as SettingsTab)}
      >
        <TabsList aria-label={s.settingsTabsLabel} className="w-full">
          <TabsTrigger value="appearance" className="flex-1">
            {s.tabAppearance}
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex-1">
            {s.tabPersonalAssets}
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="admin" className="flex-1">
              {s.tabAdminAssets}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <p className="text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
            {s.appearanceSection}
          </p>
          <div className="space-y-4 rounded-2xl bg-[var(--tg-theme-section-bg-color,var(--card))] p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
            <div className="space-y-2">
              <p className="text-sm font-medium">{s.themeLabel}</p>
              <SegmentControl
                value={theme}
                onChange={setTheme}
                ariaLabel={s.themeLabel}
                options={themeOptions}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">{d.label}</p>
              <SegmentControl
                value={locale}
                onChange={(value) => void changeLocale(value)}
                ariaLabel={d.label}
                options={locales.map((item) => ({
                  value: item,
                  label: item === "fa" ? d.fa : d.en,
                }))}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <p className="text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
            {s.personalAssetsHint}
          </p>

          {!isAuthenticated ? (
            <p className="text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
              {s.customAssetsAuthRequired}
            </p>
          ) : (
            <div className="space-y-2">
              {customAssets.length === 0 && !isLoading && (
                <p className="text-sm text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
                  {s.customAssetsEmpty}
                </p>
              )}

              {customAssets.map((asset) => (
                <SettingsRow
                  key={asset.id}
                  title={asset.name}
                  subtitle={`${decimalToPercentInput(asset.annualReturnRate)}%`}
                  color={asset.color}
                  onClick={() => openPersonalDrawer(asset)}
                />
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-2xl"
                onClick={() => openPersonalDrawer(null)}
              >
                <Plus className="me-2 h-4 w-4" />
                {s.addPersonalAsset}
              </Button>
            </div>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="admin" className="space-y-4">
            <div className="flex items-center gap-2">
              <p className="text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
                {s.adminAssetsHint}
              </p>
              <span className="shrink-0 rounded-full bg-[var(--tg-theme-secondary-bg-color,var(--muted))] px-2 py-0.5 text-[10px] font-medium text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
                {s.adminOnlyBadge}
              </span>
            </div>

            <div className="space-y-2">
              <SettingsRow
                title={s.historicalTabInflation}
                subtitle={s.drawerHistoryTab}
                onClick={() => openAdminDrawer({ kind: "inflation" })}
              />

              {portfolioAssets.map((asset) => (
                <SettingsRow
                  key={asset.id}
                  title={assetLabel(asset, locale)}
                  subtitle={s.adminAssetRowHint}
                  color={asset.color}
                  onClick={() => openAdminDrawer({ kind: "asset", asset })}
                />
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      <AdminAssetDrawer
        open={adminDrawerOpen}
        onOpenChange={setAdminDrawerOpen}
        target={adminTarget}
        locale={locale}
        dictionary={dictionary}
        historicalReturns={historicalReturns}
        onAssetSaved={(asset) => {
          setAssetClasses((items) =>
            items.map((item) => (item.id === asset.id ? asset : item)),
          );
        }}
        onHistoricalSaved={setHistoricalReturns}
      />

      <PersonalAssetDrawer
        open={personalDrawerOpen}
        onOpenChange={setPersonalDrawerOpen}
        locale={locale}
        dictionary={dictionary}
        asset={editingPersonalAsset}
        onSaved={(asset) => {
          setCustomAssets((items) =>
            items.map((item) => (item.id === asset.id ? asset : item)),
          );
        }}
        onCreated={(asset) => {
          setCustomAssets((items) => [...items, asset]);
        }}
        onDeleted={(id) => {
          setCustomAssets((items) => items.filter((item) => item.id !== id));
        }}
      />
    </div>
  );
}

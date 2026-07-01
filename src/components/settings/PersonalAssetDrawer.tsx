"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

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
import { decimalToPercentInput, percentInputToDecimal } from "@/components/settings/settings-utils";
import type { CustomAssetDto } from "@/lib/custom-assets";

type PersonalAssetDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: Locale;
  dictionary: Dictionary;
  asset: CustomAssetDto | null;
  onSaved: (asset: CustomAssetDto) => void;
  onCreated: (asset: CustomAssetDto) => void;
  onDeleted: (id: string) => void;
};

export function PersonalAssetDrawer({
  open,
  onOpenChange,
  locale,
  dictionary,
  asset,
  onSaved,
  onCreated,
  onDeleted,
}: PersonalAssetDrawerProps) {
  const s = dictionary.settings;
  const isEdit = asset != null;

  const [name, setName] = useState("");
  const [returnInput, setReturnInput] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (asset) {
      setName(asset.name);
      setReturnInput(decimalToPercentInput(asset.annualReturnRate));
      setColor(asset.color);
    } else {
      setName("");
      setReturnInput("");
      setColor("#6366f1");
    }

    setSaveState("idle");
    setError(null);
  }, [open, asset]);

  async function handleSave() {
    const trimmedName = name.trim();
    const annualReturnRate = percentInputToDecimal(returnInput);

    if (!trimmedName || annualReturnRate == null) {
      return;
    }

    setSaveState("saving");
    setError(null);

    try {
      if (isEdit && asset) {
        const res = await fetch(`/api/custom-assets/${asset.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            annualReturnRate,
            color,
          }),
        });

        if (!res.ok) {
          throw new Error("save failed");
        }

        const data = (await res.json()) as { asset: CustomAssetDto };
        onSaved(data.asset);
      } else {
        const res = await fetch("/api/custom-assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            annualReturnRate,
            color,
          }),
        });

        if (!res.ok) {
          throw new Error("create failed");
        }

        const data = (await res.json()) as { asset: CustomAssetDto };
        onCreated(data.asset);
      }

      setSaveState("saved");
      setTimeout(() => {
        setSaveState("idle");
        onOpenChange(false);
      }, 400);
    } catch {
      setError(s.saveError);
      setSaveState("idle");
    }
  }

  async function handleDelete() {
    if (!asset || !confirm(s.deleteCustomAssetConfirm)) {
      return;
    }

    setSaveState("saving");
    setError(null);

    try {
      const res = await fetch(`/api/custom-assets/${asset.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("delete failed");
      }

      onDeleted(asset.id);
      onOpenChange(false);
    } catch {
      setError(s.saveError);
      setSaveState("idle");
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader className="text-start">
          <DrawerTitle>
            {isEdit ? asset?.name || s.personalAssetsSection : s.addPersonalAsset}
          </DrawerTitle>
        </DrawerHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-2">
          <div className="space-y-2">
            <Label htmlFor="personal-asset-name">{s.customAssetName}</Label>
            <Input
              id="personal-asset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="personal-asset-return">{s.customAssetReturn}</Label>
            <NumericInput
              id="personal-asset-return"
              locale={locale}
              kind="percent"
              value={returnInput}
              onChange={setReturnInput}
            />
            <p className="text-xs text-[var(--tg-theme-hint-color,var(--muted-foreground))]">
              {s.customAssetReturnHint}
            </p>
          </div>

          <div className="space-y-2">
            <Label>{s.assetColor}</Label>
            <ColorInput value={color} onChange={setColor} />
          </div>

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}
        </div>

        <DrawerFooter className="flex-row gap-2">
          {isEdit && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => void handleDelete()}
              disabled={saveState === "saving"}
            >
              {s.deleteCustomAsset}
            </Button>
          )}
          <Button
            type="button"
            className="flex-1"
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

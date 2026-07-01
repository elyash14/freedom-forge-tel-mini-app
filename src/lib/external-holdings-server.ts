import {
  customAssetIdFromKey,
  isCustomAssetKey,
} from "@/lib/custom-assets";
import { isFreeformExternalKey } from "@/lib/external-holdings";
import { prisma } from "@/lib/prisma";

export async function validateLinkedAssetKey(
  userId: string,
  assetKey: string,
): Promise<boolean> {
  if (isFreeformExternalKey(assetKey)) {
    return false;
  }

  const assetClass = await prisma.assetClass.findFirst({
    where: { key: assetKey, isActive: true },
    select: { id: true },
  });

  if (assetClass) {
    return true;
  }

  if (isCustomAssetKey(assetKey)) {
    const assetId = customAssetIdFromKey(assetKey);
    if (!assetId) {
      return false;
    }

    const asset = await prisma.customAsset.findFirst({
      where: { id: assetId, userId },
      select: { id: true },
    });

    return asset != null;
  }

  return false;
}

export async function resolveLinkedHoldingName(
  userId: string,
  assetKey: string,
  locale: string,
): Promise<string | null> {
  const assetClass = await prisma.assetClass.findFirst({
    where: { key: assetKey, isActive: true },
    select: { labelFa: true, labelEn: true },
  });

  if (assetClass) {
    return locale === "fa" ? assetClass.labelFa : assetClass.labelEn;
  }

  if (isCustomAssetKey(assetKey)) {
    const assetId = customAssetIdFromKey(assetKey);
    if (!assetId) {
      return null;
    }

    const asset = await prisma.customAsset.findFirst({
      where: { id: assetId, userId },
      select: { name: true },
    });

    return asset?.name ?? null;
  }

  return null;
}

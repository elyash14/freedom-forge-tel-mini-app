import { customPortfolioIdFromKey, isCustomPortfolioKey } from "@/lib/custom-portfolios";
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

  if (isCustomPortfolioKey(assetKey)) {
    const portfolioId = customPortfolioIdFromKey(assetKey);
    if (!portfolioId) {
      return false;
    }

    const portfolio = await prisma.customPortfolio.findFirst({
      where: { id: portfolioId, userId },
      select: { id: true },
    });

    return portfolio != null;
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

  if (isCustomPortfolioKey(assetKey)) {
    const portfolioId = customPortfolioIdFromKey(assetKey);
    if (!portfolioId) {
      return null;
    }

    const portfolio = await prisma.customPortfolio.findFirst({
      where: { id: portfolioId, userId },
      select: { name: true },
    });

    return portfolio?.name ?? null;
  }

  return null;
}

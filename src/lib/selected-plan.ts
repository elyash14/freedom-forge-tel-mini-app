import { customPortfolioKey } from "@/lib/custom-portfolios";
import { prisma } from "@/lib/prisma";

export async function resolveSelectedPlanId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { selectedPlanId: true },
  });

  if (user?.selectedPlanId) {
    const owned = await prisma.freedomPlan.findFirst({
      where: { id: user.selectedPlanId, userId },
      select: { id: true },
    });

    if (owned) {
      return owned.id;
    }
  }

  const latestPlan = await prisma.freedomPlan.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  if (!latestPlan) {
    if (user?.selectedPlanId) {
      await prisma.user.update({
        where: { id: userId },
        data: { selectedPlanId: null },
      });
    }
    return null;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { selectedPlanId: latestPlan.id },
  });

  return latestPlan.id;
}

export async function buildAssetLabelMap(
  userId: string,
  locale: string,
): Promise<Record<string, string>> {
  const [assetClasses, customPortfolios] = await Promise.all([
    prisma.assetClass.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.customPortfolio.findMany({
      where: { userId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const labels: Record<string, string> = {};

  for (const asset of assetClasses) {
    labels[asset.key] = locale === "fa" ? asset.labelFa : asset.labelEn;
  }

  for (const portfolio of customPortfolios) {
    labels[customPortfolioKey(portfolio.id)] = portfolio.name;
  }

  return labels;
}

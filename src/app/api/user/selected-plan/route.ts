import { NextRequest, NextResponse } from "next/server";

import {
  buildAssetLabelMap,
  resolveSelectedPlanId,
} from "@/lib/selected-plan";
import { toExternalHoldingDto } from "@/lib/external-holdings";
import {
  buildAssetBreakdown,
  buildCombinedBreakdown,
  calculatePortfolioTotals,
} from "@/lib/home-stats";
import { prisma } from "@/lib/prisma";
import {
  getUserIdFromRequest,
  unauthorizedResponse,
} from "@/lib/telegram/plan-access";

type PatchSelectedPlanBody = {
  planId?: string | null;
};

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const locale = request.nextUrl.searchParams.get("locale") ?? "fa";
  const selectedPlanId = await resolveSelectedPlanId(userId);

  const [externalHoldings, assetLabels] = await Promise.all([
    prisma.externalHolding.findMany({
      where: { userId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    buildAssetLabelMap(userId, locale),
  ]);

  const externalDtos = externalHoldings.map(toExternalHoldingDto);

  if (!selectedPlanId) {
    const combinedBreakdown = buildCombinedBreakdown(
      [],
      externalDtos,
      assetLabels,
    );

    return NextResponse.json({
      selectedPlanId: null,
      plan: null,
      progress: [],
      assetLabels,
      externalHoldings: externalDtos,
      combinedBreakdown,
      totals: calculatePortfolioTotals(combinedBreakdown),
    });
  }

  const [plan, progressRecords] = await Promise.all([
    prisma.freedomPlan.findFirst({
      where: { id: selectedPlanId, userId },
    }),
    prisma.planProgress.findMany({
      where: { planId: selectedPlanId },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    }),
  ]);

  if (!plan) {
    await prisma.user.update({
      where: { id: userId },
      data: { selectedPlanId: null },
    });

    return NextResponse.json({
      selectedPlanId: null,
      plan: null,
      progress: [],
      assetLabels,
      externalHoldings: externalDtos,
      combinedBreakdown: buildCombinedBreakdown([], externalDtos, assetLabels),
      totals: calculatePortfolioTotals(
        buildCombinedBreakdown([], externalDtos, assetLabels),
      ),
    });
  }

  const latestProgress = progressRecords.at(-1) ?? null;
  const planBreakdown = buildAssetBreakdown(
    latestProgress?.assetDetails as
      | Record<string, { totalValue?: number }>
      | null
      | undefined,
    plan.assetCapitals as Record<string, number> | null | undefined,
    assetLabels,
  );
  const combinedBreakdown = buildCombinedBreakdown(
    planBreakdown,
    externalDtos,
    assetLabels,
  );

  return NextResponse.json({
    selectedPlanId,
    plan,
    progress: progressRecords,
    assetLabels,
    externalHoldings: externalDtos,
    combinedBreakdown,
    totals: calculatePortfolioTotals(combinedBreakdown),
  });
}

export async function PATCH(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as PatchSelectedPlanBody;
  const planId = body.planId ?? null;

  if (planId === null) {
    await prisma.user.update({
      where: { id: userId },
      data: { selectedPlanId: null },
    });

    return NextResponse.json({ selectedPlanId: null });
  }

  const plan = await prisma.freedomPlan.findFirst({
    where: { id: planId, userId },
    select: { id: true },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { selectedPlanId: planId },
  });

  return NextResponse.json({ selectedPlanId: planId });
}

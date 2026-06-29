import { NextRequest, NextResponse } from "next/server";

import {
  buildAssetLabelMap,
  resolveSelectedPlanId,
} from "@/lib/selected-plan";
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

  if (!selectedPlanId) {
    return NextResponse.json({
      selectedPlanId: null,
      plan: null,
      progress: [],
      assetLabels: {},
    });
  }

  const [plan, progressRecords, assetLabels] = await Promise.all([
    prisma.freedomPlan.findFirst({
      where: { id: selectedPlanId, userId },
    }),
    prisma.planProgress.findMany({
      where: { planId: selectedPlanId },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    }),
    buildAssetLabelMap(userId, locale),
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
      assetLabels: {},
    });
  }

  return NextResponse.json({
    selectedPlanId,
    plan,
    progress: progressRecords,
    assetLabels,
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

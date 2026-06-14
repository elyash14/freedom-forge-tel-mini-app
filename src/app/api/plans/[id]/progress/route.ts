import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  assertPlanOwner,
  getUserIdFromRequest,
  unauthorizedResponse,
} from "@/lib/telegram/plan-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const { id: planId } = await params;
  const plan = await assertPlanOwner(planId, userId);

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const progressRecords = await prisma.planProgress.findMany({
    where: { planId },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });

  return NextResponse.json({ progressRecords });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const { id: planId } = await params;
  const plan = await assertPlanOwner(planId, userId);

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const body = await request.json();

  const year = Number(body.year);
  const month = Number(body.month);
  const contribution = Number(body.contribution);
  const totalValue = Number(body.totalValue);
  const assetDetails = body.assetDetails || {};

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isFinite(contribution) ||
    !Number.isFinite(totalValue)
  ) {
    return NextResponse.json(
      { error: "Invalid progress data." },
      { status: 400 },
    );
  }

  const record = await prisma.planProgress.upsert({
    where: {
      planId_year_month: {
        planId,
        year,
        month,
      },
    },
    update: {
      contribution,
      totalValue,
      assetDetails,
      date: body.date ? new Date(body.date) : new Date(),
    },
    create: {
      planId,
      year,
      month,
      contribution,
      totalValue,
      assetDetails,
      date: body.date ? new Date(body.date) : new Date(),
    },
  });

  return NextResponse.json({ record });
}

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: planId } = await params;

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
  const { id: planId } = await params;
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

  // Check if plan exists
  const plan = await prisma.freedomPlan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    return NextResponse.json(
      { error: "Plan not found." },
      { status: 404 },
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

import { NextRequest, NextResponse } from "next/server";

import { calculateFreedom, type PortfolioAllocation } from "@/lib/freedom-calculator";
import { customAssetKey } from "@/lib/custom-assets";
import type { HistoricalReturnRow } from "@/lib/historical-returns";
import { prisma } from "@/lib/prisma";
import {
  getUserIdFromRequest,
  unauthorizedResponse,
} from "@/lib/telegram/plan-access";

type SavePlanBody = {
  locale: string;
  monthlyExpense: number;
  initialCapital: number;
  assetCapitals?: Record<string, number>;
  portfolioAllocation: PortfolioAllocation;
  monthlyContribution: number;
};

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const plans = await prisma.freedomPlan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ plans });
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as SavePlanBody;

  const historicalRows = await prisma.historicalReturn.findMany({
    orderBy: { year: "asc" },
  });

  const historicalData: HistoricalReturnRow[] = historicalRows.map((row) => ({
    year: row.year,
    inflation: row.inflation,
    stockMarket: row.stockMarket,
    gold: row.gold,
    bankDeposit: row.bankDeposit,
    investmentFund: row.investmentFund,
    crypto: row.crypto,
    dollar: row.dollar,
  }));

  const customAssets = await prisma.customAsset.findMany({
    where: { userId },
  });
  const customReturns = Object.fromEntries(
    customAssets.map((asset) => [
      customAssetKey(asset.id),
      asset.annualReturnRate,
    ]),
  );

  const result = calculateFreedom({
    monthlyExpense: body.monthlyExpense,
    initialCapital: body.initialCapital,
    allocation: body.portfolioAllocation,
    historicalData,
    monthlyContribution: body.monthlyContribution,
    customReturns,
  });

  if (!result) {
    return NextResponse.json(
      { error: "Invalid calculation inputs." },
      { status: 400 },
    );
  }

  const plan = await prisma.freedomPlan.create({
    data: {
      userId,
      sessionId: "",
      locale: body.locale,
      monthlyExpense: result.monthlyExpense,
      initialCapital: result.initialCapital,
      assetCapitals: body.assetCapitals ?? {},
      portfolioAllocation: body.portfolioAllocation,
      nominalReturnRate: result.nominalReturnRate,
      realReturnRate: result.realReturnRate,
      monthlyContribution: result.monthlyContribution,
      targetCapital: result.targetCapital,
      yearsToFreedom: result.yearsToFreedom,
    },
  });

  return NextResponse.json({ plan, result });
}

export async function DELETE(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  await prisma.freedomPlan.deleteMany({ where: { userId } });

  return NextResponse.json({ ok: true });
}

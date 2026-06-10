import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { calculateFreedom, type PortfolioAllocation } from "@/lib/freedom-calculator";
import type { HistoricalReturnRow } from "@/lib/historical-returns";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "freedom_session";

type SavePlanBody = {
  locale: string;
  monthlyExpense: number;
  initialCapital: number;
  portfolioAllocation: PortfolioAllocation;
  monthlyContribution: number;
};

async function getOrCreateSessionId(request: NextRequest): Promise<string> {
  const existing = request.cookies.get(SESSION_COOKIE)?.value;
  if (existing) {
    return existing;
  }

  return crypto.randomUUID();
}

export async function GET(request: NextRequest) {
  const sessionId =
    request.cookies.get(SESSION_COOKIE)?.value ??
    request.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ plans: [] });
  }

  const plans = await prisma.freedomPlan.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ plans });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as SavePlanBody;
  const sessionId = await getOrCreateSessionId(request);

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
  }));

  const result = calculateFreedom({
    monthlyExpense: body.monthlyExpense,
    initialCapital: body.initialCapital,
    allocation: body.portfolioAllocation,
    historicalData,
    monthlyContribution: body.monthlyContribution,
  });

  if (!result) {
    return NextResponse.json(
      { error: "Invalid calculation inputs." },
      { status: 400 },
    );
  }

  const plan = await prisma.freedomPlan.create({
    data: {
      sessionId,
      locale: body.locale,
      monthlyExpense: result.monthlyExpense,
      initialCapital: result.initialCapital,
      portfolioAllocation: body.portfolioAllocation,
      nominalReturnRate: result.nominalReturnRate,
      realReturnRate: result.realReturnRate,
      monthlyContribution: result.monthlyContribution,
      targetCapital: result.targetCapital,
      yearsToFreedom: result.yearsToFreedom,
    },
  });

  const response = NextResponse.json({ plan, result });

  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return response;
}

export async function DELETE() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await prisma.freedomPlan.deleteMany({ where: { sessionId } });
  }

  return NextResponse.json({ ok: true });
}

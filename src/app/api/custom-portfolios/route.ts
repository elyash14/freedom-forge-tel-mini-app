import { NextRequest, NextResponse } from "next/server";

import type { CustomPortfolioDto } from "@/lib/custom-portfolios";
import { prisma } from "@/lib/prisma";
import {
  getUserIdFromRequest,
  unauthorizedResponse,
} from "@/lib/telegram/plan-access";

type CreateCustomPortfolioBody = {
  name?: string;
  annualReturnRate?: number;
};

function toDto(portfolio: {
  id: string;
  name: string;
  annualReturnRate: number;
  sortOrder: number;
}): CustomPortfolioDto {
  return {
    id: portfolio.id,
    name: portfolio.name,
    annualReturnRate: portfolio.annualReturnRate,
    sortOrder: portfolio.sortOrder,
  };
}

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const portfolios = await prisma.customPortfolio.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ portfolios: portfolios.map(toDto) });
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as CreateCustomPortfolioBody;
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const annualReturnRate = Number(body.annualReturnRate);

  if (!Number.isFinite(annualReturnRate)) {
    return NextResponse.json(
      { error: "Annual return rate is required." },
      { status: 400 },
    );
  }

  const count = await prisma.customPortfolio.count({ where: { userId } });

  const portfolio = await prisma.customPortfolio.create({
    data: {
      userId,
      name,
      annualReturnRate,
      sortOrder: count,
    },
  });

  return NextResponse.json({ portfolio: toDto(portfolio) });
}

import { NextRequest, NextResponse } from "next/server";

import type { CustomPortfolioDto } from "@/lib/custom-portfolios";
import { isValidHexColor } from "@/lib/asset-colors";
import { prisma } from "@/lib/prisma";
import {
  getUserIdFromRequest,
  unauthorizedResponse,
} from "@/lib/telegram/plan-access";

type UpdateCustomPortfolioBody = {
  name?: string;
  annualReturnRate?: number;
  color?: string;
};

function toDto(portfolio: {
  id: string;
  name: string;
  annualReturnRate: number;
  color: string;
  sortOrder: number;
}): CustomPortfolioDto {
  return {
    id: portfolio.id,
    name: portfolio.name,
    annualReturnRate: portfolio.annualReturnRate,
    color: portfolio.color,
    sortOrder: portfolio.sortOrder,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const existing = await prisma.customPortfolio.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Portfolio not found." }, { status: 404 });
  }

  const body = (await request.json()) as UpdateCustomPortfolioBody;
  const name = body.name?.trim();
  const annualReturnRate =
    body.annualReturnRate != null ? Number(body.annualReturnRate) : undefined;
  const color = body.color?.trim();

  if (name !== undefined && !name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (annualReturnRate !== undefined && !Number.isFinite(annualReturnRate)) {
    return NextResponse.json(
      { error: "Invalid annual return rate." },
      { status: 400 },
    );
  }

  if (color !== undefined && !isValidHexColor(color)) {
    return NextResponse.json({ error: "Invalid color." }, { status: 400 });
  }

  const portfolio = await prisma.customPortfolio.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(annualReturnRate !== undefined && { annualReturnRate }),
      ...(color !== undefined && { color }),
    },
  });

  return NextResponse.json({ portfolio: toDto(portfolio) });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const existing = await prisma.customPortfolio.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Portfolio not found." }, { status: 404 });
  }

  await prisma.customPortfolio.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

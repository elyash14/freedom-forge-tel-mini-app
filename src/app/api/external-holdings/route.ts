import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

import {
  externalHoldingKey,
  isFreeformExternalKey,
  toExternalHoldingDto,
} from "@/lib/external-holdings";
import {
  resolveLinkedHoldingName,
  validateLinkedAssetKey,
} from "@/lib/external-holdings-server";
import { prisma } from "@/lib/prisma";
import {
  getUserIdFromRequest,
  unauthorizedResponse,
} from "@/lib/telegram/plan-access";

type CreateExternalHoldingBody = {
  name?: string;
  assetKey?: string;
  totalValue?: number;
};

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const holdings = await prisma.externalHolding.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    holdings: holdings.map(toExternalHoldingDto),
  });
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as CreateExternalHoldingBody;
  const totalValue = Number(body.totalValue ?? 0);
  const locale = request.nextUrl.searchParams.get("locale") ?? "fa";

  if (!Number.isFinite(totalValue) || totalValue < 0) {
    return NextResponse.json(
      { error: "Total value must be a non-negative number." },
      { status: 400 },
    );
  }

  const assetKey = body.assetKey?.trim();
  const isLinked = Boolean(assetKey);

  if (isLinked) {
    if (!assetKey || isFreeformExternalKey(assetKey)) {
      return NextResponse.json({ error: "Invalid asset key." }, { status: 400 });
    }

    const isValid = await validateLinkedAssetKey(userId, assetKey);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid asset key." }, { status: 400 });
    }

    const existing = await prisma.externalHolding.findUnique({
      where: { userId_assetKey: { userId, assetKey } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Holding already exists for this basket." },
        { status: 409 },
      );
    }

    const defaultName = await resolveLinkedHoldingName(userId, assetKey, locale);
    const name = body.name?.trim() || defaultName;

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const count = await prisma.externalHolding.count({ where: { userId } });

    const holding = await prisma.externalHolding.create({
      data: {
        userId,
        assetKey,
        name,
        totalValue,
        sortOrder: count,
      },
    });

    return NextResponse.json({ holding: toExternalHoldingDto(holding) });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const count = await prisma.externalHolding.count({ where: { userId } });
  const id = randomUUID();

  const holding = await prisma.externalHolding.create({
    data: {
      id,
      userId,
      assetKey: externalHoldingKey(id),
      name,
      totalValue,
      sortOrder: count,
    },
  });

  return NextResponse.json({ holding: toExternalHoldingDto(holding) });
}

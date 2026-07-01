import { NextRequest, NextResponse } from "next/server";

import type { CustomAssetDto } from "@/lib/custom-assets";
import { defaultColorForIndex, isValidHexColor } from "@/lib/asset-colors";
import { prisma } from "@/lib/prisma";
import {
  getUserIdFromRequest,
  unauthorizedResponse,
} from "@/lib/telegram/plan-access";

type CreateCustomAssetBody = {
  name?: string;
  annualReturnRate?: number;
  color?: string;
};

function toDto(asset: {
  id: string;
  name: string;
  annualReturnRate: number;
  color: string;
  sortOrder: number;
}): CustomAssetDto {
  return {
    id: asset.id,
    name: asset.name,
    annualReturnRate: asset.annualReturnRate,
    color: asset.color,
    sortOrder: asset.sortOrder,
  };
}

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const assets = await prisma.customAsset.findMany({
    where: { userId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ assets: assets.map(toDto) });
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as CreateCustomAssetBody;
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

  const count = await prisma.customAsset.count({ where: { userId } });
  const color =
    body.color && isValidHexColor(body.color)
      ? body.color
      : defaultColorForIndex(count);

  const asset = await prisma.customAsset.create({
    data: {
      userId,
      name,
      annualReturnRate,
      color,
      sortOrder: count,
    },
  });

  return NextResponse.json({ asset: toDto(asset) });
}

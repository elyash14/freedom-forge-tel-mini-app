import { NextRequest, NextResponse } from "next/server";

import type { CustomAssetDto } from "@/lib/custom-assets";
import { isValidHexColor } from "@/lib/asset-colors";
import { prisma } from "@/lib/prisma";
import {
  getUserIdFromRequest,
  unauthorizedResponse,
} from "@/lib/telegram/plan-access";

type UpdateCustomAssetBody = {
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const existing = await prisma.customAsset.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  const body = (await request.json()) as UpdateCustomAssetBody;
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

  const asset = await prisma.customAsset.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(annualReturnRate !== undefined && { annualReturnRate }),
      ...(color !== undefined && { color }),
    },
  });

  return NextResponse.json({ asset: toDto(asset) });
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
  const existing = await prisma.customAsset.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Asset not found." }, { status: 404 });
  }

  await prisma.customAsset.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

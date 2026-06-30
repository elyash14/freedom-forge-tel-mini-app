import { NextRequest, NextResponse } from "next/server";

import { isFreeformExternalKey, toExternalHoldingDto } from "@/lib/external-holdings";
import { prisma } from "@/lib/prisma";
import {
  getUserIdFromRequest,
  unauthorizedResponse,
} from "@/lib/telegram/plan-access";

type UpdateExternalHoldingBody = {
  name?: string;
  totalValue?: number;
  sortOrder?: number;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const existing = await prisma.externalHolding.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Holding not found." }, { status: 404 });
  }

  const body = (await request.json()) as UpdateExternalHoldingBody;
  const name = body.name?.trim();
  const totalValue =
    body.totalValue != null ? Number(body.totalValue) : undefined;
  const sortOrder =
    body.sortOrder != null ? Number(body.sortOrder) : undefined;

  if (name !== undefined && !name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  if (totalValue !== undefined && (!Number.isFinite(totalValue) || totalValue < 0)) {
    return NextResponse.json(
      { error: "Total value must be a non-negative number." },
      { status: 400 },
    );
  }

  if (sortOrder !== undefined && !Number.isFinite(sortOrder)) {
    return NextResponse.json({ error: "Invalid sort order." }, { status: 400 });
  }

  if (
    name !== undefined &&
    !isFreeformExternalKey(existing.assetKey)
  ) {
    return NextResponse.json(
      { error: "Linked holdings cannot be renamed." },
      { status: 400 },
    );
  }

  const holding = await prisma.externalHolding.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(totalValue !== undefined && { totalValue }),
      ...(sortOrder !== undefined && { sortOrder }),
    },
  });

  return NextResponse.json({ holding: toExternalHoldingDto(holding) });
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
  const existing = await prisma.externalHolding.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Holding not found." }, { status: 404 });
  }

  await prisma.externalHolding.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

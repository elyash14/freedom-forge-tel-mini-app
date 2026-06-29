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

  const { id } = await params;
  const plan = await assertPlanOwner(id, userId);

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  return NextResponse.json({ plan });
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
  const plan = await assertPlanOwner(id, userId);

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  try {
    await prisma.$transaction([
      prisma.user.updateMany({
        where: { selectedPlanId: id },
        data: { selectedPlanId: null },
      }),
      prisma.freedomPlan.delete({
        where: { id },
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete plan." },
      { status: 500 },
    );
  }
}

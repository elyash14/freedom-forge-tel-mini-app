import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getUserIdFromRequest,
  unauthorizedResponse,
} from "@/lib/telegram/plan-access";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; progressId: string }> },
) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return unauthorizedResponse();
  }

  const { id: planId, progressId } = await params;

  const plan = await prisma.freedomPlan.findFirst({
    where: { id: planId, userId },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const progress = await prisma.planProgress.findFirst({
    where: { id: progressId, planId },
  });

  if (!progress) {
    return NextResponse.json({ error: "Progress not found." }, { status: 404 });
  }

  try {
    await prisma.planProgress.delete({
      where: { id: progressId },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete progress record." },
      { status: 500 },
    );
  }
}

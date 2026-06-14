import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getAuthenticatedUserIdFromRequest,
  getUserIdFromSessionToken,
  TG_SESSION_COOKIE,
} from "@/lib/telegram/session";

export async function assertPlanOwner(planId: string, userId: string) {
  const plan = await prisma.freedomPlan.findFirst({
    where: { id: planId, userId },
  });

  return plan;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
}

export function getUserIdFromRequest(request: NextRequest): string | null {
  return getAuthenticatedUserIdFromRequest(request);
}

export async function getUserIdFromRequestOrNull(request: NextRequest) {
  return getUserIdFromSessionToken(request.cookies.get(TG_SESSION_COOKIE)?.value);
}

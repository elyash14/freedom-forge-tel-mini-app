import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserIdFromRequest } from "@/lib/telegram/session";

export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isAdminRole(role: string): role is "admin" {
  return role === "admin";
}

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden." }, { status: 403 });
}

export async function getAuthenticatedUserFromRequest(request: NextRequest) {
  const userId = getAuthenticatedUserIdFromRequest(request);
  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireAuthenticatedUserFromRequest(
  request: NextRequest,
) {
  return getAuthenticatedUserFromRequest(request);
}

export async function requireAdminFromRequest(request: NextRequest) {
  const user = await getAuthenticatedUserFromRequest(request);
  if (!user || !isAdminRole(user.role)) {
    return null;
  }

  return user;
}

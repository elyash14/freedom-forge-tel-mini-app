import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { isAdminRole } from "@/lib/auth/role-utils";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserIdFromRequest } from "@/lib/telegram/session";

export { isAdminRole, USER_ROLES, type UserRole } from "@/lib/auth/role-utils";

export function forbiddenResponse() {
  return NextResponse.json({ error: "Forbidden." }, { status: 403 });
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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

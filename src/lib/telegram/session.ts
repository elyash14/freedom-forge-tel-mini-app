import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import {
  getSessionSecret,
  TG_SESSION_COOKIE,
  TG_SESSION_MAX_AGE,
} from "@/lib/telegram/config";
import { prisma } from "@/lib/prisma";

function signUserId(userId: string): string {
  const signature = createHmac("sha256", getSessionSecret())
    .update(userId)
    .digest("hex");
  return `${userId}.${signature}`;
}

function verifySessionToken(token: string): string | null {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex <= 0) return null;

  const userId = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  const expected = createHmac("sha256", getSessionSecret())
    .update(userId)
    .digest("hex");

  try {
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }
    return userId;
  } catch {
    return null;
  }
}

export function createSessionCookieValue(userId: string): string {
  return signUserId(userId);
}

export function getUserIdFromSessionToken(token: string | undefined): string | null {
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return getUserIdFromSessionToken(cookieStore.get(TG_SESSION_COOKIE)?.value);
}

export function getAuthenticatedUserIdFromRequest(
  request: NextRequest,
): string | null {
  return getUserIdFromSessionToken(
    request.cookies.get(TG_SESSION_COOKIE)?.value,
  );
}

export async function getAuthenticatedUser() {
  const userId = await getAuthenticatedUserId();
  if (!userId) return null;

  return prisma.user.findUnique({ where: { id: userId } });
}

export async function requireAuthenticatedUserId(): Promise<string | null> {
  return getAuthenticatedUserId();
}

export { TG_SESSION_COOKIE, TG_SESSION_MAX_AGE };

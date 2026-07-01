import { NextRequest, NextResponse } from "next/server";

import { isLocale } from "@/i18n/config";
import {
  getAuthenticatedUserFromRequest,
  unauthorizedResponse,
} from "@/lib/auth/roles";
import { LOCALE_COOKIE } from "@/lib/app-preferences";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const user = await getAuthenticatedUserFromRequest(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const body = (await request.json()) as { locale?: string };

  if (!body.locale || !isLocale(body.locale)) {
    return NextResponse.json({ error: "Invalid locale." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { locale: body.locale },
  });

  const response = NextResponse.json({ locale: body.locale });
  response.cookies.set(LOCALE_COOKIE, body.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  return response;
}

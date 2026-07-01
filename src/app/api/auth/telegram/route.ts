import { NextRequest, NextResponse } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/config";
import { prisma } from "@/lib/prisma";
import {
  createSessionCookieValue,
  TG_SESSION_COOKIE,
  TG_SESSION_MAX_AGE,
} from "@/lib/telegram/session";
import { validateAndParseInitData } from "@/lib/telegram/validate-init-data";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { initData?: string };

    if (!body.initData) {
      return NextResponse.json(
        { error: "initData is required." },
        { status: 400 },
      );
    }

    const { user } = validateAndParseInitData(body.initData);
    const locale =
      user.languageCode && isLocale(user.languageCode)
        ? user.languageCode
        : defaultLocale;

    const dbUser = await prisma.user.upsert({
      where: { telegramId: BigInt(user.id) },
      update: {
        username: user.username ?? null,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        locale,
      },
      create: {
        telegramId: BigInt(user.id),
        username: user.username ?? null,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
        locale,
      },
    });

    const response = NextResponse.json({
      authenticated: true,
      user: {
        id: dbUser.id,
        telegramId: user.id.toString(),
        username: dbUser.username,
        firstName: dbUser.firstName,
        locale: dbUser.locale,
        role: String(dbUser.role),
      },
    });

    response.cookies.set(TG_SESSION_COOKIE, createSessionCookieValue(dbUser.id), {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: TG_SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Telegram auth failed:", error);
    return NextResponse.json(
      { error: "Invalid Telegram init data." },
      { status: 401 },
    );
  }
}

export async function GET(request: NextRequest) {
  const { getUserIdFromSessionToken } = await import("@/lib/telegram/session");
  const id = getUserIdFromSessionToken(
    request.cookies.get(TG_SESSION_COOKIE)?.value,
  );

  if (!id) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      telegramId: user.telegramId.toString(),
      username: user.username,
      firstName: user.firstName,
      locale: user.locale,
      role: String(user.role),
    },
  });
}

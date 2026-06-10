import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.appConfig.findUnique({
    where: { id: "default" },
  });

  if (!config) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

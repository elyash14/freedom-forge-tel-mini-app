import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.appConfig.findUnique({
    where: { id: "default" },
  });

  if (!config) {
    return NextResponse.json(
      {
        defaultWithdrawalRate: 0.3,
        defaultSavingsPercent: 20,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    defaultWithdrawalRate: config.defaultWithdrawalRate,
    defaultSavingsPercent: config.defaultSavingsPercent,
  });
}

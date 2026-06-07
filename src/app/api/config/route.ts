import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const config = await prisma.appConfig.findUnique({
    where: { id: "default" },
  });

  if (!config) {
    return NextResponse.json(
      {
        defaultInvestmentReturnRate: 0.25,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    defaultInvestmentReturnRate: config.defaultWithdrawalRate,
  });
}

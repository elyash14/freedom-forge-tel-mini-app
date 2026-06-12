import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type HistoricalReturnUpdate = {
  year: number;
  inflation: number;
  stockMarket: number;
  gold: number;
  bankDeposit: number;
  investmentFund: number;
  crypto: number | null;
};

function isValidRate(value: number): boolean {
  return Number.isFinite(value) && value > -1;
}

export async function GET() {
  const rows = await prisma.historicalReturn.findMany({
    orderBy: { year: "asc" },
  });

  return NextResponse.json(rows);
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as { rows?: HistoricalReturnUpdate[] };

  if (!body.rows?.length) {
    return NextResponse.json(
      { error: "No historical rows provided." },
      { status: 400 },
    );
  }

  for (const row of body.rows) {
    if (!Number.isInteger(row.year)) {
      return NextResponse.json(
        { error: `Invalid year: ${row.year}` },
        { status: 400 },
      );
    }

    if (
      !isValidRate(row.inflation) ||
      !isValidRate(row.stockMarket) ||
      !isValidRate(row.gold) ||
      !isValidRate(row.bankDeposit) ||
      !isValidRate(row.investmentFund) ||
      (row.crypto != null && !isValidRate(row.crypto))
    ) {
      return NextResponse.json(
        { error: `Invalid rates for year ${row.year}.` },
        { status: 400 },
      );
    }
  }

  await prisma.$transaction(
    body.rows.map((row) =>
      prisma.historicalReturn.update({
        where: { year: row.year },
        data: {
          inflation: row.inflation,
          stockMarket: row.stockMarket,
          gold: row.gold,
          bankDeposit: row.bankDeposit,
          investmentFund: row.investmentFund,
          crypto: row.crypto,
        },
      }),
    ),
  );

  const rows = await prisma.historicalReturn.findMany({
    orderBy: { year: "asc" },
  });

  return NextResponse.json(rows);
}

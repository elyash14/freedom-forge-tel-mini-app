import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.historicalReturn.findMany({
    orderBy: { year: "asc" },
  });

  return NextResponse.json(rows);
}

import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type PatchConfigBody = {
  defaultInflationRate?: number;
};

export async function GET() {
  const config = await prisma.appConfig.findUnique({
    where: { id: "default" },
  });

  if (!config) {
    return NextResponse.json({ defaultInflationRate: 0.45 });
  }

  return NextResponse.json({
    defaultInflationRate: config.defaultInflationRate,
  });
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as PatchConfigBody;

  if (
    body.defaultInflationRate != null &&
    (body.defaultInflationRate <= 0 || body.defaultInflationRate > 1)
  ) {
    return NextResponse.json(
      { error: "Invalid inflation rate." },
      { status: 400 },
    );
  }

  const config = await prisma.appConfig.upsert({
    where: { id: "default" },
    update: {
      ...(body.defaultInflationRate != null && {
        defaultInflationRate: body.defaultInflationRate,
      }),
    },
    create: {
      id: "default",
      defaultInflationRate: body.defaultInflationRate ?? 0.45,
    },
  });

  return NextResponse.json({
    defaultInflationRate: config.defaultInflationRate,
  });
}

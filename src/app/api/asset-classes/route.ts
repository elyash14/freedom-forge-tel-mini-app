import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type AssetClassUpdate = {
  id: string;
  labelFa?: string;
  labelEn?: string;
};

export async function GET() {
  const assetClasses = await prisma.assetClass.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(assetClasses);
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as { assetClasses?: AssetClassUpdate[] };

  if (!body.assetClasses?.length) {
    return NextResponse.json(
      { error: "No asset classes provided." },
      { status: 400 },
    );
  }

  await prisma.$transaction(
    body.assetClasses.map((asset) =>
      prisma.assetClass.update({
        where: { id: asset.id },
        data: {
          ...(asset.labelFa != null && { labelFa: asset.labelFa }),
          ...(asset.labelEn != null && { labelEn: asset.labelEn }),
        },
      }),
    ),
  );

  const assetClasses = await prisma.assetClass.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(assetClasses);
}

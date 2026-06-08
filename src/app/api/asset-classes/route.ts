import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type AssetClassUpdate = {
  id: string;
  labelFa?: string;
  labelEn?: string;
  historicalNominalReturn?: number;
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

  for (const asset of body.assetClasses) {
    if (!asset.id) {
      return NextResponse.json(
        { error: "Asset class id is required." },
        { status: 400 },
      );
    }

    if (
      asset.historicalNominalReturn != null &&
      (asset.historicalNominalReturn <= 0 || asset.historicalNominalReturn > 2)
    ) {
      return NextResponse.json(
        { error: "Invalid nominal return." },
        { status: 400 },
      );
    }
  }

  await prisma.$transaction(
    body.assetClasses.map((asset) =>
      prisma.assetClass.update({
        where: { id: asset.id },
        data: {
          ...(asset.labelFa != null && { labelFa: asset.labelFa }),
          ...(asset.labelEn != null && { labelEn: asset.labelEn }),
          ...(asset.historicalNominalReturn != null && {
            historicalNominalReturn: asset.historicalNominalReturn,
          }),
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

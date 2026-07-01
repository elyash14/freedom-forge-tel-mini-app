import { NextRequest, NextResponse } from "next/server";

import { isValidHexColor } from "@/lib/asset-colors";
import { prisma } from "@/lib/prisma";

type AssetClassUpdate = {
  id: string;
  labelFa?: string;
  labelEn?: string;
  color?: string;
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
    if (asset.color != null && !isValidHexColor(asset.color)) {
      return NextResponse.json({ error: "Invalid color." }, { status: 400 });
    }
  }

  await prisma.$transaction(
    body.assetClasses.map((asset) =>
      prisma.assetClass.update({
        where: { id: asset.id },
        data: {
          ...(asset.labelFa != null && { labelFa: asset.labelFa }),
          ...(asset.labelEn != null && { labelEn: asset.labelEn }),
          ...(asset.color != null && { color: asset.color }),
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

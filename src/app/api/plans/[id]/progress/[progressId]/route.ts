import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; progressId: string }> },
) {
  const { progressId } = await params;

  try {
    await prisma.planProgress.delete({
      where: { id: progressId },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete progress record." },
      { status: 500 },
    );
  }
}

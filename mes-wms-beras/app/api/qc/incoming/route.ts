import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "OPR_PROD"]);
  if (error) return error;

  try {
    const lots = await prisma.paddyLot.findMany({
      where: { status: "MENUNGGU_QC" },
      include: {
        supplier: { select: { name: true } },
        variety: { select: { name: true } },
      },
      orderBy: { arrivedAt: "asc" },
    });

    return NextResponse.json({ success: true, data: lots });
  } catch (e) {
    console.error("GET Pending QC Lots Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pending QC lots" },
      { status: 500 }
    );
  }
}

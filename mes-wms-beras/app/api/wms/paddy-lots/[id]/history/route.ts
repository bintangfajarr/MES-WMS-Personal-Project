import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "OPR_PROD"]);
  if (error) return error;

  try {
    const { id } = await params;
    const history = await prisma.rMStockMovement.findMany({
      where: { paddyLotId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: history });
  } catch (e) {
    console.error("GET Paddy Lot History Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch paddy lot stock history" },
      { status: 500 }
    );
  }
}

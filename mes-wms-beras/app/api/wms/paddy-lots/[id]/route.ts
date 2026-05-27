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
    const lot = await prisma.paddyLot.findUnique({
      where: { id },
      include: {
        supplier: true,
        variety: true,
        incomingQC: true,
        rmStockMovements: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lot) {
      return NextResponse.json(
        { success: false, error: "Paddy lot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lot });
  } catch (e) {
    console.error("GET Paddy Lot Detail Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch paddy lot detail" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "OPR_PROD"]);
  if (error) return error;

  try {
    const activeLots = await prisma.paddyLot.findMany({
      where: {
        status: {
          notIn: ["DITOLAK", "SELESAI"],
        },
      },
      select: {
        netWeight: true,
        status: true,
      },
    });

    const totalWeight = activeLots.reduce((sum, lot) => sum + Number(lot.netWeight), 0);
    const activeCount = activeLots.length;
    const waitingQcCount = activeLots.filter((lot) => lot.status === "MENUNGGU_QC").length;

    return NextResponse.json({
      success: true,
      data: {
        totalWeight,
        activeCount,
        waitingQcCount,
      },
    });
  } catch (e) {
    console.error("GET Paddy Warehouse Stats Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch warehouse stats" },
      { status: 500 }
    );
  }
}

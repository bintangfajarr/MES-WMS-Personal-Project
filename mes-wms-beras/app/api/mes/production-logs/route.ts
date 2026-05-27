import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function GET(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD", "OPR_WHS"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const workOrderId = searchParams.get("workOrderId");

    if (!workOrderId) {
      return NextResponse.json(
        { success: false, error: "WorkOrderId query parameter is required" },
        { status: 400 }
      );
    }

    const logs = await prisma.productionLog.findMany({
      where: { workOrderId },
      include: {
        machine: { select: { name: true, code: true, type: true } },
        operator: { select: { name: true, email: true } },
        dryingLog: true,
        huskingLog: true,
        polishingLog: true,
        sortingLog: true,
        packagingLog: {
          include: {
            packagingConsumptions: {
              include: {
                packagingMaterial: { select: { name: true, code: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (e) {
    console.error("GET Production Logs Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch production logs" },
      { status: 500 }
    );
  }
}

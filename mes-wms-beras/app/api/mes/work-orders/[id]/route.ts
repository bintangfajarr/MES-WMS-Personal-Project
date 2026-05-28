import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD", "OPR_WHS"]);
  if (error) return error;

  try {
    const { id } = await params;

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        paddyLot: {
          include: {
            variety: { select: { name: true, code: true } },
            supplier: { select: { name: true, code: true } },
            incomingQC: true,
          },
        },
        createdBy: { select: { name: true, email: true } },
        steps: {
          orderBy: { stepOrder: "asc" },
        },
        productionLogs: {
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
        },
      },
    });

    if (!workOrder) {
      return NextResponse.json(
        { success: false, error: "Work order tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: workOrder });
  } catch (e) {
    console.error("GET Work Order Detail Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch work order detail" },
      { status: 500 }
    );
  }
}

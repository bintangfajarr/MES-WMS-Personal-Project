import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { WorkOrderStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Allow ADMIN and OPR_PROD to update status generally, but enforce role restrictions inside
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD"]);
  if (error) return error;

  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body as { status: WorkOrderStatus };

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { paddyLot: true },
    });

    if (!workOrder) {
      return NextResponse.json(
        { success: false, error: "Work order tidak ditemukan" },
        { status: 404 }
      );
    }

    if (status === "CANCELLED") {
      // 1. Only ADMIN can cancel
      if (session.user.role !== "ADMIN") {
        return NextResponse.json(
          { success: false, error: "Hanya Admin yang dapat membatalkan Work Order" },
          { status: 403 }
        );
      }

      // 2. Cannot cancel if already IN_PROGRESS or SELESAI
      if (workOrder.status !== "DRAFT") {
        return NextResponse.json(
          { success: false, error: "Work Order tidak dapat dibatalkan karena sudah berjalan atau selesai" },
          { status: 400 }
        );
      }

      // 3. Revert PaddyLot status back to ANTRIAN_GILING and set WO to CANCELLED
      const updatedWO = await prisma.$transaction(async (tx) => {
        const wo = await tx.workOrder.update({
          where: { id },
          data: { status: "CANCELLED" },
        });

        await tx.paddyLot.update({
          where: { id: workOrder.paddyLotId },
          data: { status: "ANTRIAN_GILING" },
        });

        return wo;
      });

      return NextResponse.json({ success: true, data: updatedWO });
    }

    // Generic status transition check
    if (status === "IN_PROGRESS") {
      if (workOrder.status !== "DRAFT") {
        return NextResponse.json(
          { success: false, error: "Hanya Work Order dengan status DRAFT yang bisa diubah ke IN_PROGRESS" },
          { status: 400 }
        );
      }
      
      const updatedWO = await prisma.workOrder.update({
        where: { id },
        data: { 
          status: "IN_PROGRESS",
          startedAt: workOrder.startedAt || new Date(),
        },
      });

      return NextResponse.json({ success: true, data: updatedWO });
    }

    if (status === "SELESAI") {
      // Typically completed through steps in phase 8, but allow manual if needed
      const updatedWO = await prisma.$transaction(async (tx) => {
        const wo = await tx.workOrder.update({
          where: { id },
          data: { 
            status: "SELESAI",
            completedAt: new Date(),
          },
        });

        await tx.paddyLot.update({
          where: { id: workOrder.paddyLotId },
          data: { status: "SELESAI" },
        });

        return wo;
      });

      return NextResponse.json({ success: true, data: updatedWO });
    }

    // Fallback simple update
    const updatedWO = await prisma.workOrder.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updatedWO });
  } catch (e) {
    console.error("PATCH Work Order Status Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to update work order status" },
      { status: 500 }
    );
  }
}

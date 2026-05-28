import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Can be triggered by DRIVER or ADMIN
  const { session, error } = await requireAuth(["ADMIN", "DRIVER", "OPR_WHS"]);
  if (error) return error;

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const deliveryOrder = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            batch: true,
          },
        },
      },
    });

    if (!deliveryOrder) {
      return NextResponse.json(
        { success: false, error: "Delivery Order tidak ditemukan" },
        { status: 404 }
      );
    }

    if (deliveryOrder.status !== "SHIPPED") {
      return NextResponse.json(
        {
          success: false,
          error: `Status Delivery Order adalah ${deliveryOrder.status}. Konfirmasi barang tiba hanya bisa dilakukan jika status SHIPPED`,
        },
        { status: 400 }
      );
    }

    // Drivers should only delivered DOs assigned to them
    if (session.user.role === "DRIVER" && deliveryOrder.driverId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Anda tidak ditugaskan untuk pengiriman ini" },
        { status: 403 }
      );
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update DeliveryOrder status to DELIVERED
      const updatedDO = await tx.deliveryOrder.update({
        where: { id },
        data: {
          status: "DELIVERED",
          deliveredAt: now,
        },
      });

      // 2. Process each item and adjust batch stocks
      for (const item of deliveryOrder.items) {
        // Set shippedQty in DeliveryOrderItem to orderedQty
        await tx.deliveryOrderItem.update({
          where: { id: item.id },
          data: {
            shippedQty: item.orderedQty,
          },
        });

        const batch = item.batch;
        const newTotalSak = Math.max(0, batch.totalSak - item.orderedQty);
        const newWeightKg = newTotalSak * Number(batch.packagingSize);

        // Update FinishedGoodsBatch
        await tx.finishedGoodsBatch.update({
          where: { id: batch.id },
          data: {
            totalSak: newTotalSak,
            totalWeightKg: newWeightKg,
            status: newTotalSak <= 0 ? "SHIPPED" : "DI_GUDANG",
            locationId: newTotalSak <= 0 ? null : batch.locationId,
          },
        });

        // If batch is empty, check and release the location status if no other active batches are there
        if (newTotalSak <= 0 && batch.locationId) {
          const otherBatches = await tx.finishedGoodsBatch.count({
            where: {
              locationId: batch.locationId,
              id: { not: batch.id },
              status: "DI_GUDANG",
            },
          });
          if (otherBatches === 0) {
            await tx.warehouseLocation.update({
              where: { id: batch.locationId },
              data: { status: "KOSONG" },
            });
          }
        }

        // 3. Confirm FGStockMovement (update description to Confipped / Delivered)
        await tx.fGStockMovement.updateMany({
          where: {
            reference: deliveryOrder.doNumber,
            batchId: batch.id,
            type: "OUT",
          },
          data: {
            description: `Pengiriman terkonfirmasi ke pelanggan untuk DO ${deliveryOrder.doNumber}`,
          },
        });
      }

      return updatedDO;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    console.error("PATCH Delivery Order Delivered Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to confirm delivery arrival" },
      { status: 500 }
    );
  }
}

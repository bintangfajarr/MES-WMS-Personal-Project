import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { deliveryReturnSchema } from "@/lib/validations/delivery-order";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  // Returns can be logged by Driver or Admin
  const { session, error } = await requireAuth(["ADMIN", "DRIVER", "OPR_WHS"]);
  if (error) return error;

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const deliveryOrder = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!deliveryOrder) {
      return NextResponse.json(
        { success: false, error: "Delivery Order tidak ditemukan" },
        { status: 404 }
      );
    }

    if (deliveryOrder.status !== "DELIVERED" && deliveryOrder.status !== "SHIPPED") {
      return NextResponse.json(
        {
          success: false,
          error: `Status Delivery Order adalah ${deliveryOrder.status}. Pencatatan retur hanya bisa dilakukan jika status SHIPPED atau DELIVERED`,
        },
        { status: 400 }
      );
    }

    // Drivers should only view and edit their own assigned DOs
    if (session.user.role === "DRIVER" && deliveryOrder.driverId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Anda tidak ditugaskan untuk pengiriman ini" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = deliveryReturnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { items, notes } = parsed.data;

    // Validate that each item returned was actually part of the Delivery Order
    for (const item of items) {
      const orderItem = deliveryOrder.items.find((i) => i.batchId === item.batchId);
      if (!orderItem) {
        return NextResponse.json(
          {
            success: false,
            error: `Item dengan Batch ID ${item.batchId} tidak ditemukan dalam Delivery Order ini`,
          },
          { status: 400 }
        );
      }
      if (item.returnedQty > orderItem.orderedQty) {
        return NextResponse.json(
          {
            success: false,
            error: `Jumlah yang diretur (${item.returnedQty}) melebihi jumlah yang dipesan (${orderItem.orderedQty})`,
          },
          { status: 400 }
        );
      }
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update DeliveryOrder status to PARTIAL_RETURN
      const updatedDO = await tx.deliveryOrder.update({
        where: { id },
        data: {
          status: "PARTIAL_RETURN",
        },
      });

      // 2. Process each returned item
      for (const item of items) {
        // Create DeliveryReturn record
        await tx.deliveryReturn.create({
          data: {
            deliveryOrderId: id,
            batchId: item.batchId,
            returnedQty: item.returnedQty,
            reason: item.reason,
            notes: notes || null,
            returnedAt: now,
          },
        });

        // Fetch batch details to adjust weight
        const batch = await tx.finishedGoodsBatch.findUnique({
          where: { id: item.batchId },
        });

        if (batch) {
          const newTotalSak = batch.totalSak + item.returnedQty;
          const newWeightKg = newTotalSak * Number(batch.packagingSize);

          // Update FinishedGoodsBatch stock and status
          await tx.finishedGoodsBatch.update({
            where: { id: item.batchId },
            data: {
              totalSak: newTotalSak,
              totalWeightKg: newWeightKg,
              status: "DI_GUDANG", // Returned items go back to available stock
            },
          });

          // Create FGStockMovement (type: IN, retur)
          await tx.fGStockMovement.create({
            data: {
              batchId: item.batchId,
              type: "IN",
              quantity: item.returnedQty,
              description: `Retur dari DO ${deliveryOrder.doNumber}: ${item.reason}`,
              reference: deliveryOrder.doNumber,
            },
          });
        }
      }

      return updatedDO;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    console.error("POST Delivery Return Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to record delivery return" },
      { status: 500 }
    );
  }
}

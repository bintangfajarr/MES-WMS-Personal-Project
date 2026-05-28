import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

// PATCH - Admin approves a stock opname (adjusts stock)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;

    const opname = await prisma.stockOpname.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            batch: true,
          },
        },
      },
    });

    if (!opname) {
      return NextResponse.json(
        { success: false, error: "Stock opname tidak ditemukan" },
        { status: 404 }
      );
    }

    if (opname.isApproved) {
      return NextResponse.json(
        { success: false, error: "Stock opname sudah disetujui sebelumnya" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Approve the stock opname
      const updatedOpname = await tx.stockOpname.update({
        where: { id },
        data: {
          isApproved: true,
          approvedBy: session.user.id,
          approvedAt: new Date(),
        },
      });

      // 2. For each item with variance ≠ 0, create FGStockMovement + update batch
      for (const item of opname.items) {
        if (item.variance !== 0) {
          // Create adjustment movement
          await tx.fGStockMovement.create({
            data: {
              batchId: item.batchId,
              type: "ADJUSTMENT",
              quantity: item.variance, // positive = surplus, negative = shrinkage
              description: `Penyesuaian stock opname. Sistem: ${item.systemQty}, Fisik: ${item.physicalQty}, Selisih: ${item.variance}`,
              reference: `SO-${id.slice(-8)}`,
            },
          });

          // Update batch totalSak to match physical count
          await tx.finishedGoodsBatch.update({
            where: { id: item.batchId },
            data: {
              totalSak: item.physicalQty,
              totalWeightKg:
                item.physicalQty * Number(item.batch.packagingSize),
            },
          });
        }
      }

      return updatedOpname;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    console.error("PATCH Approve Stock Opname Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to approve stock opname" },
      { status: 500 }
    );
  }
}

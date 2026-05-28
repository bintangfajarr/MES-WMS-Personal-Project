import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { packagingLogSchema } from "@/lib/validations/production-log";
import { addYears } from "date-fns";

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD"]);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = packagingLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { workOrderId, items, materials, notes } = parsed.data;

    // Fetch steps to validate predecessor (SORTASI_GRADING)
    const steps = await prisma.workOrderStep.findMany({
      where: { workOrderId },
      orderBy: { stepOrder: "asc" },
    });

    const sortingStep = steps.find((s) => s.stepType === "SORTASI_GRADING");
    const packagingStep = steps.find((s) => s.stepType === "PENGEMASAN");

    if (!packagingStep) {
      return NextResponse.json(
        { success: false, error: "Langkah Pengemasan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (sortingStep && sortingStep.status !== "SELESAI") {
      return NextResponse.json(
        { success: false, error: "Langkah Sortasi & Grading belum diselesaikan" },
        { status: 400 }
      );
    }

    if (packagingStep.status === "SELESAI") {
      return NextResponse.json(
        { success: false, error: "Langkah Pengemasan sudah diselesaikan" },
        { status: 400 }
      );
    }

    const wo = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { paddyLot: true },
    });

    if (!wo) {
      return NextResponse.json(
        { success: false, error: "Work Order tidak ditemukan" },
        { status: 404 }
      );
    }

    // Calculations & Product categorization
    const productIds = items.map((it) => it.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    let totalSakPremium = 0;
    let totalSakMedium = 0;
    let totalSakPatah = 0;
    let totalWeightKg = 0;

    for (const item of items) {
      const prod = dbProducts.find((p) => p.id === item.productId);
      if (!prod) {
        return NextResponse.json(
          { success: false, error: `Produk dengan ID ${item.productId} tidak ditemukan` },
          { status: 404 }
        );
      }

      const weight = item.totalSak * item.packagingSize;
      totalWeightKg += weight;

      if (prod.type === "PREMIUM") {
        totalSakPremium += item.totalSak;
      } else if (prod.type === "MEDIUM") {
        totalSakMedium += item.totalSak;
      } else if (prod.type === "PATAH") {
        totalSakPatah += item.totalSak;
      }
    }

    const netWeight = Number(wo.paddyLot.netWeight);
    const overallYield = Math.round((totalWeightKg / netWeight) * 100 * 100) / 100;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create ProductionLog
      const prodLog = await tx.productionLog.create({
        data: {
          workOrderId,
          stepType: "PENGEMASAN",
          operatorId: session.user.id,
          inputWeight: netWeight, // Packaging uses paddy net weight or sorting output as logical input
          outputWeight: totalWeightKg,
          yield: overallYield,
          startTime: now,
          endTime: now,
          notes,
        },
      });

      // 2. Create PackagingLog
      const pkgLog = await tx.packagingLog.create({
        data: {
          productionLogId: prodLog.id,
          totalSakPremium,
          totalSakMedium,
          totalSakPatah,
          totalWeightKg,
          looseRemainder: 0,
        },
      });

      // 3. Create PackagingConsumption & Deduct Stock
      for (const mat of materials) {
        await tx.packagingConsumption.create({
          data: {
            packagingLogId: pkgLog.id,
            packagingMaterialId: mat.materialId,
            quantityUsed: mat.qty,
          },
        });

        await tx.packagingMaterial.update({
          where: { id: mat.materialId },
          data: {
            currentStock: {
              decrement: mat.qty,
            },
          },
        });
      }

      // 4. Create FinishedGoodsBatch per item
      for (const item of items) {
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
        const randStr = Math.random().toString(36).substring(2, 7).toUpperCase();
        const batchNumber = `BATCH-${dateStr}-${randStr}`;

        const fgBatch = await tx.finishedGoodsBatch.create({
          data: {
            batchNumber,
            workOrderId,
            productId: item.productId,
            packagingSize: item.packagingSize,
            totalSak: item.totalSak,
            totalWeightKg: item.totalSak * item.packagingSize,
            productionDate: now,
            expiryDate: addYears(now, 1),
            status: "PRODUKSI",
          },
        });

        // Create FG Stock Movement
        await tx.fGStockMovement.create({
          data: {
            batchId: fgBatch.id,
            type: "IN",
            quantity: item.totalSak,
            description: `Produksi awal dari WO ${wo.woNumber}`,
          },
        });
      }

      // 5. Update WorkOrderStep
      await tx.workOrderStep.update({
        where: { id: packagingStep.id },
        data: {
          status: "SELESAI",
          startedAt: packagingStep.startedAt || now,
          completedAt: now,
        },
      });

      // 6. Update WorkOrder Status to SELESAI
      await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: "SELESAI",
          actualOutput: totalWeightKg,
          overallYield,
          completedAt: now,
        },
      });

      // 7. Update PaddyLot Status to SELESAI
      await tx.paddyLot.update({
        where: { id: wo.paddyLotId },
        data: {
          status: "SELESAI",
        },
      });

      // 8. Yield threshold check: Alert if overall yield < 58%
      if (overallYield < 58) {
        const existingAlert = await tx.alert.findFirst({
          where: { type: "YIELD_RENDAH", referenceId: workOrderId, isActive: true },
        });
        if (!existingAlert) {
          await tx.alert.create({
            data: {
              type: "YIELD_RENDAH",
              message: `Yield total/overall untuk WO ${wo.woNumber} sangat rendah: ${overallYield}% (minimum 58%)`,
              referenceId: workOrderId,
            },
          });
        }
      }

      return prodLog;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    console.error("POST Packaging Log Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to create packaging log" },
      { status: 500 }
    );
  }
}

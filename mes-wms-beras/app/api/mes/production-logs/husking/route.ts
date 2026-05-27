import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { huskingLogSchema } from "@/lib/validations/production-log";

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD"]);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = huskingLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const {
      workOrderId,
      machineId,
      inputWeight,
      brownRiceOutput,
      huskOutput,
      startTime,
      endTime,
      notes,
    } = parsed.data;

    // Fetch steps to validate predecessor (PENGERINGAN)
    const steps = await prisma.workOrderStep.findMany({
      where: { workOrderId },
      orderBy: { stepOrder: "asc" },
    });

    const dryingStep = steps.find((s) => s.stepType === "PENGERINGAN");
    const huskingStep = steps.find((s) => s.stepType === "PENGGILINGAN");

    if (!huskingStep) {
      return NextResponse.json(
        { success: false, error: "Langkah Penggilingan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (dryingStep && dryingStep.status !== "SELESAI" && dryingStep.status !== "SKIPPED") {
      return NextResponse.json(
        { success: false, error: "Langkah Pengeringan belum diselesaikan atau dilewati" },
        { status: 400 }
      );
    }

    if (huskingStep.status === "SELESAI") {
      return NextResponse.json(
        { success: false, error: "Langkah Penggilingan sudah diselesaikan" },
        { status: 400 }
      );
    }

    const wo = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
    });

    if (!wo) {
      return NextResponse.json(
        { success: false, error: "Work Order tidak ditemukan" },
        { status: 404 }
      );
    }

    // Calculations
    const huskingYield = Math.round((brownRiceOutput / inputWeight) * 100 * 100) / 100;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create ProductionLog
      const prodLog = await tx.productionLog.create({
        data: {
          workOrderId,
          machineId,
          stepType: "PENGGILINGAN",
          operatorId: session.user.id,
          inputWeight,
          outputWeight: brownRiceOutput,
          yield: huskingYield,
          startTime,
          endTime,
          notes,
        },
      });

      // 2. Create HuskingLog
      await tx.huskingLog.create({
        data: {
          productionLogId: prodLog.id,
          brownRiceOutput,
          huskOutput,
          huskingYield,
        },
      });

      // 3. Update WorkOrderStep
      await tx.workOrderStep.update({
        where: { id: huskingStep.id },
        data: {
          status: "SELESAI",
          startedAt: huskingStep.startedAt || startTime,
          completedAt: endTime,
        },
      });

      // 4. Threshold Check: Alert if husking yield < 75%
      if (huskingYield < 75) {
        const existingAlert = await tx.alert.findFirst({
          where: { type: "HUSKING_YIELD_RENDAH", referenceId: workOrderId, isActive: true },
        });
        if (!existingAlert) {
          await tx.alert.create({
            data: {
              type: "HUSKING_YIELD_RENDAH",
              message: `Yield penggilingan/husking untuk WO ${wo.woNumber} rendah: ${huskingYield}% (minimum 75%)`,
              referenceId: workOrderId,
            },
          });
        }
      }

      // 5. Update sekam (by-product) warehouse location status to TERISI
      const byProductLocation = await tx.warehouseLocation.findFirst({
        where: { type: "BY_PRODUCT" },
      });
      if (byProductLocation) {
        await tx.warehouseLocation.update({
          where: { id: byProductLocation.id },
          data: { status: "TERISI" },
        });
      }

      return prodLog;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    console.error("POST Husking Log Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to create husking log" },
      { status: 500 }
    );
  }
}

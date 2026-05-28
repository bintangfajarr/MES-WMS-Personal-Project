import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { dryingLogSchema } from "@/lib/validations/production-log";

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD"]);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = dryingLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      workOrderId,
      machineId,
      inputWeight,
      tempCelsius,
      moistureIn,
      moistureOut,
      weightAfterDrying,
      startTime,
      endTime,
      notes,
    } = parsed.data;

    // Fetch WO and the step
    const wo = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: {
        steps: {
          where: { stepType: "PENGERINGAN" },
        },
      },
    });

    if (!wo) {
      return NextResponse.json(
        { success: false, error: "Work Order tidak ditemukan" },
        { status: 404 }
      );
    }

    if (wo.status === "CANCELLED" || wo.status === "SELESAI") {
      return NextResponse.json(
        { success: false, error: "Work Order sudah dibatalkan atau selesai" },
        { status: 400 }
      );
    }

    const step = wo.steps[0];
    if (!step) {
      return NextResponse.json(
        { success: false, error: "Langkah Pengeringan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (step.status === "SELESAI" || step.status === "SKIPPED") {
      return NextResponse.json(
        { success: false, error: "Langkah Pengeringan sudah diselesaikan atau dilewati" },
        { status: 400 }
      );
    }

    // Calculations
    const dryingLoss = inputWeight - weightAfterDrying;
    const dryingYield = Math.round((weightAfterDrying / inputWeight) * 100 * 100) / 100;
    const isCompleted = moistureOut <= 14;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create ProductionLog
      const prodLog = await tx.productionLog.create({
        data: {
          workOrderId,
          machineId,
          stepType: "PENGERINGAN",
          operatorId: session.user.id,
          inputWeight,
          outputWeight: weightAfterDrying,
          yield: dryingYield,
          startTime,
          endTime,
          notes,
        },
      });

      // 2. Create DryingLog
      await tx.dryingLog.create({
        data: {
          productionLogId: prodLog.id,
          tempCelsius,
          moistureIn,
          moistureOut,
          dryingLoss,
        },
      });

      // 3. Update WorkOrderStep
      await tx.workOrderStep.update({
        where: { id: step.id },
        data: {
          status: isCompleted ? "SELESAI" : "IN_PROGRESS",
          startedAt: step.startedAt || startTime,
          completedAt: isCompleted ? endTime : undefined,
        },
      });

      // 4. Update WorkOrder startedAt and status
      await tx.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: "IN_PROGRESS",
          startedAt: wo.startedAt || startTime,
        },
      });

      return prodLog;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    console.error("POST Drying Log Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to create drying log" },
      { status: 500 }
    );
  }
}

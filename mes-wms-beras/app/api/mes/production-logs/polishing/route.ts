import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { polishingLogSchema } from "@/lib/validations/production-log";

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD"]);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = polishingLogSchema.safeParse(body);
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
      soshLevel,
      whiteRiceOutput,
      branOutput,
      startTime,
      endTime,
      notes,
    } = parsed.data;

    // Fetch steps to validate predecessor (PENGGILINGAN)
    const steps = await prisma.workOrderStep.findMany({
      where: { workOrderId },
      orderBy: { stepOrder: "asc" },
    });

    const huskingStep = steps.find((s) => s.stepType === "PENGGILINGAN");
    const polishingStep = steps.find((s) => s.stepType === "PENYOSOHAN");

    if (!polishingStep) {
      return NextResponse.json(
        { success: false, error: "Langkah Penyosohan tidak ditemukan" },
        { status: 404 }
      );
    }

    if (huskingStep && huskingStep.status !== "SELESAI") {
      return NextResponse.json(
        { success: false, error: "Langkah Penggilingan belum diselesaikan" },
        { status: 400 }
      );
    }

    if (polishingStep.status === "SELESAI") {
      return NextResponse.json(
        { success: false, error: "Langkah Penyosohan sudah diselesaikan" },
        { status: 400 }
      );
    }

    // Calculations
    const polishingYield = Math.round((whiteRiceOutput / inputWeight) * 100 * 100) / 100;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create ProductionLog
      const prodLog = await tx.productionLog.create({
        data: {
          workOrderId,
          machineId,
          stepType: "PENYOSOHAN",
          operatorId: session.user.id,
          inputWeight,
          outputWeight: whiteRiceOutput,
          yield: polishingYield,
          startTime,
          endTime,
          notes,
        },
      });

      // 2. Create PolishingLog
      await tx.polishingLog.create({
        data: {
          productionLogId: prodLog.id,
          soshLevel,
          whiteRiceOutput,
          branOutput,
          polishingYield,
        },
      });

      // 3. Update WorkOrderStep
      await tx.workOrderStep.update({
        where: { id: polishingStep.id },
        data: {
          status: "SELESAI",
          startedAt: polishingStep.startedAt || startTime,
          completedAt: endTime,
        },
      });

      // 4. Update bekatul (by-product) warehouse location status to TERISI
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
    console.error("POST Polishing Log Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to create polishing log" },
      { status: 500 }
    );
  }
}

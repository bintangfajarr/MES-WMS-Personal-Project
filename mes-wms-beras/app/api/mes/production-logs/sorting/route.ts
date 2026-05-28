import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { sortingLogSchema } from "@/lib/validations/production-log";

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD"]);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = sortingLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const {
      workOrderId,
      inputWeight,
      wholeGrainOutput,
      halfBrokenOutput,
      quarterBrokenOutput,
      rejectedOutput,
      startTime,
      endTime,
      notes,
    } = parsed.data;

    // Fetch steps to validate predecessor (PENYOSOHAN)
    const steps = await prisma.workOrderStep.findMany({
      where: { workOrderId },
      orderBy: { stepOrder: "asc" },
    });

    const polishingStep = steps.find((s) => s.stepType === "PENYOSOHAN");
    const sortingStep = steps.find((s) => s.stepType === "SORTASI_GRADING");

    if (!sortingStep) {
      return NextResponse.json(
        { success: false, error: "Langkah Sortasi & Grading tidak ditemukan" },
        { status: 404 }
      );
    }

    if (polishingStep && polishingStep.status !== "SELESAI") {
      return NextResponse.json(
        { success: false, error: "Langkah Penyosohan belum diselesaikan" },
        { status: 400 }
      );
    }

    if (sortingStep.status === "SELESAI") {
      return NextResponse.json(
        { success: false, error: "Langkah Sortasi & Grading sudah diselesaikan" },
        { status: 400 }
      );
    }

    // Validate output sum vs input weight with 0.5% tolerance
    const totalOutput = wholeGrainOutput + halfBrokenOutput + quarterBrokenOutput + rejectedOutput;
    const maxAllowedOutput = inputWeight * 1.005;

    if (totalOutput > maxAllowedOutput) {
      return NextResponse.json(
        {
          success: false,
          error: `Total output (${totalOutput} kg) melebihi input (${inputWeight} kg) dengan toleransi 0.5% (${maxAllowedOutput.toFixed(2)} kg)`,
        },
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
    const wholeGrainRatio = Math.round((wholeGrainOutput / inputWeight) * 100 * 100) / 100;
    const sortingYield = Math.round((totalOutput / inputWeight) * 100 * 100) / 100;

    // Automatic grading decision
    const targetProducts = (wo.targetProducts as string[]) || [];
    let premiumAlloc = 0;
    let mediumAlloc = 0;
    let patahAlloc = halfBrokenOutput + quarterBrokenOutput;

    if (wholeGrainRatio >= 95 && targetProducts.includes("PREMIUM")) {
      premiumAlloc = wholeGrainOutput;
    } else if (targetProducts.includes("MEDIUM")) {
      mediumAlloc = wholeGrainOutput;
    } else if (targetProducts.includes("PREMIUM")) {
      premiumAlloc = wholeGrainOutput;
    } else {
      patahAlloc += wholeGrainOutput;
    }

    const gradingDecision = {
      PREMIUM: premiumAlloc,
      MEDIUM: mediumAlloc,
      PATAH: patahAlloc,
    };

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create ProductionLog
      const prodLog = await tx.productionLog.create({
        data: {
          workOrderId,
          stepType: "SORTASI_GRADING",
          operatorId: session.user.id,
          inputWeight,
          outputWeight: totalOutput,
          yield: sortingYield,
          startTime,
          endTime,
          notes,
        },
      });

      // 2. Create SortingLog
      await tx.sortingLog.create({
        data: {
          productionLogId: prodLog.id,
          wholeGrainOutput,
          halfBrokenOutput,
          quarterBrokenOutput,
          rejectedOutput,
          wholeGrainRatio,
          gradingDecision: gradingDecision,
        },
      });

      // 3. Update WorkOrderStep
      await tx.workOrderStep.update({
        where: { id: sortingStep.id },
        data: {
          status: "SELESAI",
          startedAt: sortingStep.startedAt || startTime,
          completedAt: endTime,
        },
      });

      return prodLog;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    console.error("POST Sorting Log Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to create sorting log" },
      { status: 500 }
    );
  }
}

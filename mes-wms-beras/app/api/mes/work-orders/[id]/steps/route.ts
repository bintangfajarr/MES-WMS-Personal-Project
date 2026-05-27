import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { WorkOrderStepStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD"]);
  if (error) return error;

  try {
    const { id: workOrderId } = params;
    const body = await request.json();
    const { stepId, status } = body as { stepId: string; status: WorkOrderStepStatus };

    if (!stepId || !status) {
      return NextResponse.json(
        { success: false, error: "StepId and Status are required" },
        { status: 400 }
      );
    }

    const step = await prisma.workOrderStep.findUnique({
      where: { id: stepId },
      include: { workOrder: true },
    });

    if (!step || step.workOrderId !== workOrderId) {
      return NextResponse.json(
        { success: false, error: "Langkah Work Order tidak ditemukan" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update step status
      const updatedStep = await tx.workOrderStep.update({
        where: { id: stepId },
        data: {
          status,
          startedAt: status === "IN_PROGRESS" ? new Date() : undefined,
          completedAt: status === "SELESAI" ? new Date() : undefined,
        },
      });

      // 2. If starting first step, update WorkOrder status to IN_PROGRESS
      if (status === "IN_PROGRESS" && step.workOrder.status === "DRAFT") {
        await tx.workOrder.update({
          where: { id: workOrderId },
          data: {
            status: "IN_PROGRESS",
            startedAt: new Date(),
          },
        });
      }

      return updatedStep;
    });

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    console.error("PATCH Work Order Step Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to update work order step" },
      { status: 500 }
    );
  }
}

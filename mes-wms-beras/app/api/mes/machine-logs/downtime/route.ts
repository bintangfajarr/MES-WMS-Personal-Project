import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { downtimeLogSchema } from "@/lib/validations/production-log";
import { MachineStatus } from "@prisma/client";

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD"]);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = downtimeLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { machineId, reason, startTime, endTime, notes } = parsed.data;

    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
    });

    if (!machine) {
      return NextResponse.json(
        { success: false, error: "Mesin tidak ditemukan" },
        { status: 404 }
      );
    }

    // Calculate duration in minutes
    let duration: number | null = null;
    if (endTime) {
      duration = Math.round(
        (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000
      );
    }

    // Map DowntimeReason to MachineStatus
    let targetStatus: MachineStatus = "INACTIVE";
    if (reason === "BREAKDOWN") {
      targetStatus = "BREAKDOWN";
    } else if (reason === "MAINTENANCE") {
      targetStatus = "MAINTENANCE";
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create DowntimeLog
      const log = await tx.downtimeLog.create({
        data: {
          machineId,
          reason,
          startTime,
          endTime,
          duration,
          notes,
        },
      });

      // 2. Update Machine Status
      await tx.machine.update({
        where: { id: machineId },
        data: { status: targetStatus },
      });

      return log;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    console.error("POST Machine Downtime Log Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to create downtime log" },
      { status: 500 }
    );
  }
}

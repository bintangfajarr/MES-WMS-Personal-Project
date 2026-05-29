import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { calculateOEE } from "@/lib/utils/yield-calculator";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD", "OPR_WHS"]);
  if (error) return error;

  try {
    const machines = await prisma.machine.findMany({
      include: {
        productionLogs: true,
        downtimeLogs: true,
      },
      orderBy: { code: "asc" },
    });

    const oeeReport = machines.map((machine) => {
      // 1. Calculate cumulative production operation minutes
      let totalProductionMinutes = 0;
      machine.productionLogs.forEach((log) => {
        const start = new Date(log.startTime).getTime();
        const end = new Date(log.endTime).getTime();
        const diffMinutes = Math.round((end - start) / (1000 * 60));
        totalProductionMinutes += Math.max(diffMinutes, 0);
      });

      // 2. Calculate cumulative downtime minutes
      let totalDowntimeMinutes = 0;
      machine.downtimeLogs.forEach((log) => {
        if (log.duration) {
          totalDowntimeMinutes += log.duration;
        } else if (log.endTime) {
          const start = new Date(log.startTime).getTime();
          const end = new Date(log.endTime).getTime();
          const diffMinutes = Math.round((end - start) / (1000 * 60));
          totalDowntimeMinutes += Math.max(diffMinutes, 0);
        }
      });

      // 3. Planned operating time is operating + downtime
      const plannedTimeMinutes = totalProductionMinutes + totalDowntimeMinutes;

      // 4. Calculate OEE availability
      const oee = plannedTimeMinutes > 0 ? calculateOEE(plannedTimeMinutes, totalDowntimeMinutes) : 100;

      return {
        id: machine.id,
        code: machine.code,
        name: machine.name,
        type: machine.type,
        status: machine.status,
        productionMinutes: totalProductionMinutes,
        downtimeMinutes: totalDowntimeMinutes,
        plannedMinutes: plannedTimeMinutes,
        oee,
      };
    });

    return NextResponse.json({
      success: true,
      data: oeeReport,
    });
  } catch (e) {
    console.error("GET Machine OEE Report Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to generate machine OEE report" },
      { status: 500 }
    );
  }
}

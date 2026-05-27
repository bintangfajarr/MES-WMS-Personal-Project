import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function GET(
  request: Request,
  { params }: { params: { machineId: string } }
) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD", "OPR_WHS"]);
  if (error) return error;

  try {
    const { machineId } = params;

    const machine = await prisma.machine.findUnique({
      where: { id: machineId },
    });

    if (!machine) {
      return NextResponse.json(
        { success: false, error: "Mesin tidak ditemukan" },
        { status: 404 }
      );
    }

    const [downtimeLogs, productionLogs] = await Promise.all([
      prisma.downtimeLog.findMany({
        where: { machineId },
        orderBy: { startTime: "desc" },
        take: 50,
      }),
      prisma.productionLog.findMany({
        where: { machineId },
        include: {
          operator: { select: { name: true } },
          workOrder: { select: { woNumber: true } },
        },
        orderBy: { startTime: "desc" },
        take: 50,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        machine,
        downtimeLogs,
        productionLogs,
      },
    });
  } catch (e) {
    console.error("GET Machine Logs Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch machine logs" },
      { status: 500 }
    );
  }
}

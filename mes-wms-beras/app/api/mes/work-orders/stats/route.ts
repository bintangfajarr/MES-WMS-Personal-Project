import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD", "OPR_WHS"]);
  if (error) return error;

  try {
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);

    const [totalCount, activeCount, completedTodayCount] = await Promise.all([
      prisma.workOrder.count(),
      prisma.workOrder.count({
        where: { status: "IN_PROGRESS" },
      }),
      prisma.workOrder.count({
        where: {
          status: "SELESAI",
          completedAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total: totalCount,
        active: activeCount,
        completedToday: completedTodayCount,
      },
    });
  } catch (e) {
    console.error("GET Work Orders Stats Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch work order stats" },
      { status: 500 }
    );
  }
}

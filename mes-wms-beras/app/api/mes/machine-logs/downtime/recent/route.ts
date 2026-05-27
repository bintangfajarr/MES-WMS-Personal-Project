import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD", "OPR_WHS"]);
  if (error) return error;

  try {
    const logs = await prisma.downtimeLog.findMany({
      include: {
        machine: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
      take: 20,
    });

    return NextResponse.json({ success: true, data: logs });
  } catch (e) {
    console.error("GET Recent Downtime Logs Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recent downtime logs" },
      { status: 500 }
    );
  }
}

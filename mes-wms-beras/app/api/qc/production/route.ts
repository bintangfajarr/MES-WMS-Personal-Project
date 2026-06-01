import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function GET(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD", "OPR_WHS"]);
  if (error) return error;

  try {
    // 1. Fetch recent sorting logs
    const sortingLogs = await prisma.sortingLog.findMany({
      include: {
        productionLog: {
          include: {
            workOrder: {
              include: {
                paddyLot: {
                  include: {
                    variety: { select: { name: true } }
                  }
                }
              }
            },
            operator: { select: { name: true } }
          }
        }
      },
      orderBy: {
        productionLog: {
          createdAt: "desc"
        }
      },
    });

    // 2. Fetch Incoming QC records
    const incomingQCs = await prisma.incomingQC.findMany({
      include: {
        paddyLot: {
          include: {
            supplier: { select: { name: true } },
            variety: { select: { name: true } }
          }
        }
      },
      orderBy: { inspectedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        sortingLogs,
        incomingQCs,
      }
    });
  } catch (e) {
    console.error("GET Production QC Error:", e);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data QC Produksi" },
      { status: 500 }
    );
  }
}

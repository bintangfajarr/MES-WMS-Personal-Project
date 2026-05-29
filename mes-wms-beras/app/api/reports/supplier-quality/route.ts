import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD", "OPR_WHS"]);
  if (error) return error;

  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        paddyLots: {
          include: {
            incomingQC: true,
            workOrders: {
              where: { status: "SELESAI" },
              select: { overallYield: true },
            },
          },
        },
      },
      orderBy: { code: "asc" },
    });

    const supplierQualityReport = suppliers.map((supplier) => {
      const totalLots = supplier.paddyLots.length;
      
      let acceptedCount = 0;
      let moistureSum = 0;
      let yieldSum = 0;
      let yieldCount = 0;

      supplier.paddyLots.forEach((lot) => {
        moistureSum += Number(lot.moistureContent);
        
        // Accepted if incomingQC result is LULUS or status is in accepted categories
        const isQcPassed = lot.incomingQC?.result === "LULUS";
        const isStatusAccepted = ["DITERIMA", "ANTRIAN_GILING", "SEDANG_DIGILING", "SELESAI"].includes(lot.status);
        if (isQcPassed || isStatusAccepted) {
          acceptedCount++;
        }

        // Gather completed yield figures
        lot.workOrders.forEach((wo) => {
          if (wo.overallYield) {
            yieldSum += Number(wo.overallYield);
            yieldCount++;
          }
        });
      });

      const acceptanceRate = totalLots > 0 ? (acceptedCount / totalLots) * 100 : 0;
      const avgMoisture = totalLots > 0 ? moistureSum / totalLots : 0;
      const avgYield = yieldCount > 0 ? yieldSum / yieldCount : 0;

      return {
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        totalLots,
        acceptedLots: acceptedCount,
        acceptanceRate: Math.round(acceptanceRate * 100) / 100,
        avgMoisture: Math.round(avgMoisture * 100) / 100,
        avgYield: Math.round(avgYield * 100) / 100,
      };
    });

    return NextResponse.json({
      success: true,
      data: supplierQualityReport,
    });
  } catch (e) {
    console.error("GET Supplier Quality Report Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to generate supplier quality report" },
      { status: 500 }
    );
  }
}

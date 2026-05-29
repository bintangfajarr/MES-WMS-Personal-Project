import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function GET(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD", "OPR_WHS"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Default to last 30 days if not provided
    const start = startDateParam
      ? new Date(startDateParam)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDateParam ? new Date(endDateParam) : new Date();
    end.setHours(23, 59, 59, 999);

    const workOrders = await prisma.workOrder.findMany({
      where: {
        completedAt: { gte: start, lte: end },
        status: "SELESAI",
      },
      include: {
        paddyLot: {
          include: {
            variety: true,
          },
        },
        productionLogs: {
          include: {
            huskingLog: true,
            polishingLog: true,
            packagingLog: true,
          },
        },
        finishedGoodsBatches: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Extract statistics
    let totalPaddyWeight = 0;
    let totalRiceWeight = 0;
    let totalOverallYieldSum = 0;
    let totalHuskingYieldSum = 0;
    let huskingLogsCount = 0;
    let totalPolishingYieldSum = 0;
    let polishingLogsCount = 0;

    // Track output per product grade
    const productOutputs: Record<string, { sku: string; name: string; totalSacks: number; totalWeightKg: number }> = {};

    const list = workOrders.map((wo) => {
      const paddyWeight = Number(wo.paddyLot.netWeight);
      const riceWeight = Number(wo.actualOutput || 0);
      const overallYield = Number(wo.overallYield || 0);

      totalPaddyWeight += paddyWeight;
      totalRiceWeight += riceWeight;
      totalOverallYieldSum += overallYield;

      // Extract step yields from production logs
      let huskingYield = 0;
      let polishingYield = 0;

      wo.productionLogs.forEach((log) => {
        if (log.stepType === "PENGGILINGAN" && log.huskingLog) {
          const yieldVal = Number(log.huskingLog.huskingYield);
          huskingYield = yieldVal;
          totalHuskingYieldSum += yieldVal;
          huskingLogsCount++;
        }
        if (log.stepType === "PENYOSOHAN" && log.polishingLog) {
          const yieldVal = Number(log.polishingLog.polishingYield);
          polishingYield = yieldVal;
          totalPolishingYieldSum += yieldVal;
          polishingLogsCount++;
        }
      });

      // Sum up finished goods output
      const batchesList = wo.finishedGoodsBatches.map((batch) => {
        const prod = batch.product;
        const key = prod.id;
        const sacks = batch.totalSak;
        const weight = Number(batch.totalWeightKg);

        if (!productOutputs[key]) {
          productOutputs[key] = {
            sku: prod.sku,
            name: prod.name,
            totalSacks: 0,
            totalWeightKg: 0,
          };
        }
        productOutputs[key].totalSacks += sacks;
        productOutputs[key].totalWeightKg += weight;

        return {
          sku: prod.sku,
          name: prod.name,
          sacks,
          weightKg: weight,
        };
      });

      return {
        id: wo.id,
        woNumber: wo.woNumber,
        completedAt: wo.completedAt,
        paddyLotNumber: wo.paddyLot.lotNumber,
        paddyVariety: wo.paddyLot.variety.name,
        paddyInputKg: paddyWeight,
        riceOutputKg: riceWeight,
        huskingYield,
        polishingYield,
        overallYield,
        batches: batchesList,
      };
    });

    const count = workOrders.length;
    const averageOverallYield = count > 0 ? totalOverallYieldSum / count : 0;
    const averageHuskingYield = huskingLogsCount > 0 ? totalHuskingYieldSum / huskingLogsCount : 0;
    const averagePolishingYield = polishingLogsCount > 0 ? totalPolishingYieldSum / polishingLogsCount : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalPaddyWeightKg: Math.round(totalPaddyWeight * 100) / 100,
          totalRiceWeightKg: Math.round(totalRiceWeight * 100) / 100,
          averageOverallYield: Math.round(averageOverallYield * 100) / 100,
          averageHuskingYield: Math.round(averageHuskingYield * 100) / 100,
          averagePolishingYield: Math.round(averagePolishingYield * 100) / 100,
          workOrdersCompleted: count,
        },
        productSummary: Object.values(productOutputs).map((prod) => ({
          ...prod,
          totalWeightKg: Math.round(prod.totalWeightKg * 100) / 100,
        })),
        workOrders: list,
      },
    });
  } catch (e) {
    console.error("GET Production Report Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to generate production report" },
      { status: 500 }
    );
  }
}

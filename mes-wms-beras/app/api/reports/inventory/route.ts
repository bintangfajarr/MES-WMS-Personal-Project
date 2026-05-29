import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { format } from "date-fns";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "OPR_PROD"]);
  if (error) return error;

  try {
    const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    // 1. Fetch RM & FG Stock Movements for the past 30 days
    const rmMovementsPromise = prisma.rMStockMovement.findMany({
      where: { createdAt: { gte: start } },
      orderBy: { createdAt: "asc" },
    });

    const fgMovementsPromise = prisma.fGStockMovement.findMany({
      where: { createdAt: { gte: start } },
      include: {
        batch: {
          select: {
            packagingSize: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // 2. Fetch current stock vs minimum stock
    const productsPromise = prisma.product.findMany({
      where: { isActive: true },
      include: {
        finishedGoodsBatches: {
          where: { status: { in: ["DI_GUDANG", "RESERVED"] } },
          select: {
            totalSak: true,
            totalWeightKg: true,
          },
        },
      },
      orderBy: { sku: "asc" },
    });

    const [rmMovements, fgMovements, products] = await Promise.all([
      rmMovementsPromise,
      fgMovementsPromise,
      productsPromise,
    ]);

    // Group movements by date YYYY-MM-DD
    const movementMap: Record<string, any> = {};

    // Initialize map for the past 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, "yyyy-MM-dd");
      movementMap[dateStr] = {
        date: dateStr,
        paddyInKg: 0,
        paddyOutKg: 0,
        riceInSacks: 0,
        riceOutSacks: 0,
        riceInKg: 0,
        riceOutKg: 0,
      };
    }

    // Process Paddy lot movements
    rmMovements.forEach((m) => {
      const dateStr = format(new Date(m.createdAt), "yyyy-MM-dd");
      if (movementMap[dateStr]) {
        const val = Number(m.weightKg);
        if (m.type === "IN") {
          movementMap[dateStr].paddyInKg += val;
        } else if (m.type === "OUT") {
          movementMap[dateStr].paddyOutKg += val;
        }
      }
    });

    // Process Rice batch movements
    fgMovements.forEach((m) => {
      const dateStr = format(new Date(m.createdAt), "yyyy-MM-dd");
      if (movementMap[dateStr]) {
        const sacks = m.quantity;
        const kg = sacks * Number(m.batch.packagingSize);
        if (m.type === "IN") {
          movementMap[dateStr].riceInSacks += sacks;
          movementMap[dateStr].riceInKg += kg;
        } else if (m.type === "OUT") {
          movementMap[dateStr].riceOutSacks += sacks;
          movementMap[dateStr].riceOutKg += kg;
        }
      }
    });

    const dailyMovements = Object.values(movementMap);

    // Calculate current levels vs minimums
    const stockStatus = products.map((prod) => {
      const currentSacks = prod.finishedGoodsBatches.reduce((sum, b) => sum + b.totalSak, 0);
      const currentWeight = prod.finishedGoodsBatches.reduce((sum, b) => sum + Number(b.totalWeightKg), 0);

      return {
        id: prod.id,
        sku: prod.sku,
        name: prod.name,
        type: prod.type,
        currentSacks,
        currentWeightKg: Math.round(currentWeight * 100) / 100,
        minimumStockSacks: prod.minimumStock,
        status: currentSacks < prod.minimumStock ? "DI_BAWAH_MINIMUM" : "AMAN",
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        dailyMovements,
        stockStatus,
      },
    });
  } catch (e) {
    console.error("GET Inventory Report Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to generate inventory report" },
      { status: 500 }
    );
  }
}

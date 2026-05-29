import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "OPR_PROD"]);
  if (error) return error;

  try {
    // 1. Paddy Stock (Lots that are active and not rejected/completed)
    const paddyLotsPromise = prisma.paddyLot.findMany({
      where: {
        status: {
          notIn: ["DITOLAK", "SELESAI"],
        },
      },
      select: {
        netWeight: true,
      },
    });

    // 2. Rice Stock grouped by Product (excluding BY_PRODUCT types)
    const productsPromise = prisma.product.findMany({
      where: { isActive: true, type: { not: "BY_PRODUCT" } },
      include: {
        finishedGoodsBatches: {
          where: {
            status: { in: ["DI_GUDANG", "RESERVED"] },
          },
          select: {
            totalSak: true,
            totalWeightKg: true,
          },
        },
      },
      orderBy: { sku: "asc" },
    });

    // 3. Active Work Orders (IN_PROGRESS status)
    const activeWorkOrdersPromise = prisma.workOrder.count({
      where: {
        status: "IN_PROGRESS",
      },
    });

    // 4. Pending Deliveries (CONFIRMED, PICKING, READY_TO_SHIP status)
    const pendingDeliveriesPromise = prisma.deliveryOrder.count({
      where: {
        status: {
          in: ["CONFIRMED", "PICKING", "READY_TO_SHIP"],
        },
      },
    });

    // 5. Active Alerts
    const activeAlertsPromise = prisma.alert.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 6. Recent Work Orders (5 latest)
    const recentWorkOrdersPromise = prisma.workOrder.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        paddyLot: {
          include: {
            variety: true,
          },
        },
      },
    });

    // 7. Machine Statuses
    const machineStatusesPromise = prisma.machine.findMany({
      orderBy: {
        code: "asc",
      },
    });

    // Execute queries in parallel using Promise.all
    const [
      paddyLots,
      products,
      activeWorkOrders,
      pendingDeliveries,
      activeAlerts,
      recentWorkOrders,
      machineStatuses,
    ] = await Promise.all([
      paddyLotsPromise,
      productsPromise,
      activeWorkOrdersPromise,
      pendingDeliveriesPromise,
      activeAlertsPromise,
      recentWorkOrdersPromise,
      machineStatusesPromise,
    ]);

    // Calculate active paddy weight
    const paddyStockKg = paddyLots.reduce((sum, lot) => sum + Number(lot.netWeight), 0);

    // Format rice stock by product
    const riceStockByProduct = products.map((prod) => {
      const totalSak = prod.finishedGoodsBatches.reduce((sum, b) => sum + b.totalSak, 0);
      const totalKg = prod.finishedGoodsBatches.reduce((sum, b) => sum + Number(b.totalWeightKg), 0);
      return {
        sku: prod.sku,
        name: prod.name,
        totalSak,
        totalKg: Math.round(totalKg * 100) / 100,
      };
    });

    // 8. Calculate 7-day comparative production/delivery trend & overall yield
    const productionChartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      // Inbound Paddy: netWeight of PaddyLots arrived and accepted today
      const paddyLotsToday = await prisma.paddyLot.findMany({
        where: {
          arrivedAt: { gte: startOfDay, lte: endOfDay },
          status: { not: "DITOLAK" },
        },
        select: { netWeight: true },
      });
      const paddyIn = paddyLotsToday.reduce((sum, lot) => sum + Number(lot.netWeight), 0);

      // Outbound Rice: delivered/shipped today
      const deliveryOrdersToday = await prisma.deliveryOrder.findMany({
        where: {
          deliveryDate: { gte: startOfDay, lte: endOfDay },
          status: { in: ["SHIPPED", "DELIVERED", "PARTIAL_RETURN"] },
        },
        include: {
          items: {
            include: {
              batch: true,
            },
          },
        },
      });
      let riceOut = 0;
      deliveryOrdersToday.forEach((doOrder) => {
        doOrder.items.forEach((item) => {
          riceOut += item.orderedQty * Number(item.batch.packagingSize);
        });
      });

      // Average Yield of completed WOs today
      const completedWOsToday = await prisma.workOrder.findMany({
        where: {
          completedAt: { gte: startOfDay, lte: endOfDay },
          status: "SELESAI",
        },
        select: { overallYield: true },
      });
      const yieldSum = completedWOsToday.reduce((sum, wo) => sum + Number(wo.overallYield || 0), 0);
      const avgYield = completedWOsToday.length > 0 ? yieldSum / completedWOsToday.length : 0;

      productionChartData.push({
        date: format(startOfDay, "dd MMM", { locale: localeId }),
        paddyIn,
        riceOut,
        yield: Math.round(avgYield * 100) / 100,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        paddyStockKg,
        riceStockByProduct,
        activeWorkOrders,
        pendingDeliveries,
        activeAlerts,
        recentWorkOrders,
        machineStatuses,
        productionChartData,
      },
    });
  } catch (e) {
    console.error("GET Dashboard Stats Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}

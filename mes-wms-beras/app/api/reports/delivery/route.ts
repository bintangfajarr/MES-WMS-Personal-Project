import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function GET(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "OPR_PROD"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Default to last 30 days
    const start = startDateParam
      ? new Date(startDateParam)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDateParam ? new Date(endDateParam) : new Date();
    end.setHours(23, 59, 59, 999);

    const orders = await prisma.deliveryOrder.findMany({
      where: {
        deliveryDate: { gte: start, lte: end },
      },
      include: {
        customer: true,
        driver: { select: { name: true } },
        items: {
          include: {
            batch: true,
          },
        },
        returns: true,
      },
      orderBy: { deliveryDate: "desc" },
    });

    let totalSacksShipped = 0;
    let totalWeightShippedKg = 0;
    let deliveredCount = 0;
    let onTimeCount = 0;
    let totalReturnedSacks = 0;
    let returnTransactionsCount = 0;

    const list = orders.map((order) => {
      let orderSacks = 0;
      let orderWeight = 0;

      order.items.forEach((item) => {
        orderSacks += item.orderedQty;
        orderWeight += item.orderedQty * Number(item.batch.packagingSize);
      });

      totalSacksShipped += order.status !== "CANCELLED" && order.status !== "DRAFT" ? orderSacks : 0;
      totalWeightShippedKg += order.status !== "CANCELLED" && order.status !== "DRAFT" ? orderWeight : 0;

      // Check delivery timeliness on completed ones
      let isOnTime = null;
      if (order.status === "DELIVERED" || order.status === "PARTIAL_RETURN") {
        deliveredCount++;
        if (order.deliveredAt && order.deliveryDate) {
          const dDateLimit = new Date(order.deliveryDate).setHours(23, 59, 59, 999);
          const dAtTime = new Date(order.deliveredAt).getTime();
          if (dAtTime <= dDateLimit) {
            onTimeCount++;
            isOnTime = true;
          } else {
            isOnTime = false;
          }
        }
      }

      // Check returns
      let orderReturnedSacks = 0;
      if (order.returns && order.returns.length > 0) {
        returnTransactionsCount++;
        order.returns.forEach((r) => {
          orderReturnedSacks += r.returnedQty;
        });
        totalReturnedSacks += orderReturnedSacks;
      }

      return {
        id: order.id,
        doNumber: order.doNumber,
        deliveryDate: order.deliveryDate,
        shippedAt: order.shippedAt,
        deliveredAt: order.deliveredAt,
        status: order.status,
        customerName: order.customer.name,
        driverName: order.driver?.name || "Belum Ditugaskan",
        totalSacks: orderSacks,
        totalWeightKg: orderWeight,
        isOnTime,
        returnedQty: orderReturnedSacks,
      };
    });

    const onTimeRate = deliveredCount > 0 ? (onTimeCount / deliveredCount) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalDeliveries: orders.length,
          totalSacksShipped,
          totalWeightShippedKg: Math.round(totalWeightShippedKg * 100) / 100,
          deliveredCount,
          onTimeCount,
          onTimeDeliveryRate: Math.round(onTimeRate * 100) / 100,
          totalReturnedSacks,
          returnTransactionsCount,
        },
        deliveries: list,
      },
    });
  } catch (e) {
    console.error("GET Delivery Report Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to generate delivery report" },
      { status: 500 }
    );
  }
}

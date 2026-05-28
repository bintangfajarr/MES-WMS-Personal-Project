import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "OPR_PROD"]);
  if (error) return error;

  try {
    // Fetch all active batches grouped by product
    const products = await prisma.product.findMany({
      where: { isActive: true, type: { not: "BY_PRODUCT" } },
      include: {
        finishedGoodsBatches: {
          where: {
            status: { in: ["DI_GUDANG", "RESERVED", "PRODUKSI"] },
          },
          select: {
            id: true,
            totalSak: true,
            totalWeightKg: true,
            expiryDate: true,
            status: true,
          },
        },
      },
      orderBy: { sku: "asc" },
    });

    const summary = products.map((product) => {
      const batches = product.finishedGoodsBatches;
      const totalSak = batches.reduce((sum, b) => sum + b.totalSak, 0);
      const totalKg = batches.reduce(
        (sum, b) => sum + Number(b.totalWeightKg),
        0
      );
      const batchCount = batches.length;

      // Find the nearest expiry date among active batches
      const nearestExpiry =
        batches.length > 0
          ? batches.reduce((earliest, b) =>
              b.expiryDate < earliest ? b.expiryDate : earliest,
            batches[0].expiryDate)
          : null;

      return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        type: product.type,
        totalSak,
        totalKg: Math.round(totalKg * 100) / 100,
        batchCount,
        nearestExpiry,
        minimumStock: product.minimumStock,
      };
    });

    return NextResponse.json({ success: true, data: summary });
  } catch (e) {
    console.error("GET Rice Stock Summary Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rice stock summary" },
      { status: 500 }
    );
  }
}

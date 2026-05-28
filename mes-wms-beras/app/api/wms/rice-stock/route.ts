import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { BatchStatus } from "@prisma/client";

export async function GET(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "OPR_PROD"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || undefined;
    const status = searchParams.get("status") as BatchStatus | null;
    const locationId = searchParams.get("locationId") || undefined;
    const expiringInDays = searchParams.get("expiringInDays");

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;
    if (status) where.status = status;
    if (locationId) where.locationId = locationId;

    if (expiringInDays) {
      const days = parseInt(expiringInDays, 10);
      if (!isNaN(days) && days > 0) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() + days);
        where.expiryDate = { lte: cutoff };
        // Only include batches still in warehouse
        if (!status) {
          where.status = { in: ["DI_GUDANG", "RESERVED"] };
        }
      }
    }

    const [total, data] = await Promise.all([
      prisma.finishedGoodsBatch.count({ where }),
      prisma.finishedGoodsBatch.findMany({
        where,
        include: {
          product: { select: { sku: true, name: true, type: true } },
          workOrder: { select: { woNumber: true } },
          location: { select: { code: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    console.error("GET Rice Stock Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rice stock" },
      { status: 500 }
    );
  }
}

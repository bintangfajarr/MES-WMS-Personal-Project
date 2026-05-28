import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { createPaddyLotSchema } from "@/lib/validations/paddy-lot";
import { generateLotNumber } from "@/lib/utils/lot-number";
import { calculateNetWeight } from "@/lib/utils/net-weight";
import { PaddyLotStatus } from "@prisma/client";

export async function GET(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "OPR_PROD"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as PaddyLotStatus | null;
    const varietyId = searchParams.get("varietyId") || undefined;
    const supplierId = searchParams.get("supplierId") || undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (varietyId) where.varietyId = varietyId;
    if (supplierId) where.supplierId = supplierId;

    if (startDate || endDate) {
      where.arrivedAt = {};
      if (startDate) where.arrivedAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.arrivedAt.lte = end;
      }
    }

    const [total, data] = await Promise.all([
      prisma.paddyLot.count({ where }),
      prisma.paddyLot.findMany({
        where,
        include: {
          supplier: { select: { name: true, code: true } },
          variety: { select: { name: true, code: true } },
          incomingQC: true,
        },
        orderBy: { arrivedAt: "desc" },
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
    console.error("GET Paddy Lots Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch paddy lots" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS"]);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createPaddyLotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { supplierId, varietyId, grossWeight, sackWeight, moistureContent, dirtPercentage, notes } = parsed.data;

    // Verify supplier and variety exist
    const [supplier, variety] = await Promise.all([
      prisma.supplier.findUnique({ where: { id: supplierId } }),
      prisma.paddyVariety.findUnique({ where: { id: varietyId } }),
    ]);

    if (!supplier) {
      return NextResponse.json(
        { success: false, error: "Supplier not found" },
        { status: 404 }
      );
    }
    if (!variety) {
      return NextResponse.json(
        { success: false, error: "Variety not found" },
        { status: 404 }
      );
    }

    const lotNumber = await generateLotNumber();
    const netWeight = calculateNetWeight(grossWeight, sackWeight, dirtPercentage);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Paddy Lot
      const lot = await tx.paddyLot.create({
        data: {
          lotNumber,
          supplierId,
          varietyId,
          grossWeight,
          sackWeight,
          netWeight,
          moistureContent,
          dirtPercentage,
          notes,
          status: "MENUNGGU_QC",
        },
      });

      // 2. Create Stock Movement (IN)
      await tx.rMStockMovement.create({
        data: {
          paddyLotId: lot.id,
          type: "IN",
          weightKg: netWeight,
          description: "Penerimaan padi awal",
          reference: lotNumber,
        },
      });

      return lot;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    console.error("POST Paddy Lot Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to create paddy lot" },
      { status: 500 }
    );
  }
}

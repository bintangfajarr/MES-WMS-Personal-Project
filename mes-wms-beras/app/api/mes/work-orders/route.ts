import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { createWorkOrderSchema } from "@/lib/validations/work-order";
import { generateWONumber } from "@/lib/utils/wo-number";

export async function GET(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_PROD", "OPR_WHS"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [total, data] = await Promise.all([
      prisma.workOrder.count({ where }),
      prisma.workOrder.findMany({
        where,
        include: {
          paddyLot: {
            include: {
              variety: { select: { name: true, code: true } },
              supplier: { select: { name: true, code: true } },
            },
          },
          createdBy: { select: { name: true, email: true } },
          steps: {
            orderBy: { stepOrder: "asc" },
          },
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
    console.error("GET Work Orders Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch work orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createWorkOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { paddyLotId, targetProducts, estimatedOutput, deadline, notes } = parsed.data;

    // Verify lot exists and status is ANTRIAN_GILING
    const lot = await prisma.paddyLot.findUnique({
      where: { id: paddyLotId },
      include: { incomingQC: true },
    });

    if (!lot) {
      return NextResponse.json(
        { success: false, error: "Lot padi tidak ditemukan" },
        { status: 404 }
      );
    }

    if (lot.status !== "ANTRIAN_GILING") {
      return NextResponse.json(
        { success: false, error: "Lot padi harus berada dalam status ANTRIAN_GILING" },
        { status: 400 }
      );
    }

    // Determine moisture content to see if drying can be skipped
    const moisture = lot.incomingQC 
      ? Number(lot.incomingQC.moistureContent) 
      : Number(lot.moistureContent);

    const isDryingSkipped = moisture <= 14;

    const woNumber = await generateWONumber();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create WorkOrder
      const wo = await tx.workOrder.create({
        data: {
          woNumber,
          paddyLotId,
          targetProducts: targetProducts,
          estimatedOutput,
          deadline,
          notes,
          status: "DRAFT",
          createdById: session.user.id,
        },
      });

      // 2. Create 5 WorkOrderSteps
      const stepsData = [
        {
          workOrderId: wo.id,
          stepType: "PENGERINGAN" as const,
          stepOrder: 1,
          status: isDryingSkipped ? ("SKIPPED" as const) : ("BELUM_MULAI" as const),
          notes: isDryingSkipped ? "Dilewati karena kadar air giling sudah <= 14%" : null,
        },
        {
          workOrderId: wo.id,
          stepType: "PENGGILINGAN" as const,
          stepOrder: 2,
          status: "BELUM_MULAI" as const,
        },
        {
          workOrderId: wo.id,
          stepType: "PENYOSOHAN" as const,
          stepOrder: 3,
          status: "BELUM_MULAI" as const,
        },
        {
          workOrderId: wo.id,
          stepType: "SORTASI_GRADING" as const,
          stepOrder: 4,
          status: "BELUM_MULAI" as const,
        },
        {
          workOrderId: wo.id,
          stepType: "PENGEMASAN" as const,
          stepOrder: 5,
          status: "BELUM_MULAI" as const,
        },
      ];

      await tx.workOrderStep.createMany({
        data: stepsData,
      });

      // 3. Update Paddy Lot Status -> RESERVED
      await tx.paddyLot.update({
        where: { id: paddyLotId },
        data: { status: "RESERVED" },
      });

      return wo;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    console.error("POST Work Order Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to create work order" },
      { status: 500 }
    );
  }
}

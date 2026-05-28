import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { createDeliveryOrderSchema } from "@/lib/validations/delivery-order";
import { generateDONumber } from "@/lib/utils/do-number";
import { DeliveryOrderStatus } from "@prisma/client";

// GET: list delivery orders
export async function GET(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "DRIVER"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as DeliveryOrderStatus | null;
    const customerId = searchParams.get("customerId") || undefined;
    const driverId = searchParams.get("driverId") || undefined;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (driverId) where.driverId = driverId;

    if (startDate || endDate) {
      where.deliveryDate = {};
      if (startDate) {
        where.deliveryDate.gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.deliveryDate.lte = end;
      }
    }

    // Drivers should only see their assigned DOs
    if (session.user.role === "DRIVER") {
      where.driverId = session.user.id;
    }

    const [total, data] = await Promise.all([
      prisma.deliveryOrder.count({ where }),
      prisma.deliveryOrder.findMany({
        where,
        include: {
          customer: { select: { code: true, name: true, deliveryAddress: true, city: true } },
          driver: { select: { id: true, name: true } },
          createdBy: { select: { name: true } },
          items: {
            include: {
              batch: {
                include: {
                  product: { select: { sku: true, name: true } },
                },
              },
            },
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
    console.error("GET Delivery Orders Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch delivery orders" },
      { status: 500 }
    );
  }
}

// POST: create a new Delivery Order
export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS"]);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createDeliveryOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { customerId, driverId, deliveryDate, items, notes } = parsed.data;

    // Validate customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Pelanggan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Validate driver if provided
    if (driverId) {
      const driver = await prisma.user.findUnique({
        where: { id: driverId },
      });
      if (!driver || driver.role !== "DRIVER") {
        return NextResponse.json(
          { success: false, error: "Driver tidak ditemukan atau user bukan role DRIVER" },
          { status: 400 }
        );
      }
    }

    // Validate batches and stocks
    const batchIds = items.map((i) => i.batchId);
    const dbBatches = await prisma.finishedGoodsBatch.findMany({
      where: { id: { in: batchIds } },
    });

    for (const item of items) {
      const batch = dbBatches.find((b) => b.id === item.batchId);
      if (!batch) {
        return NextResponse.json(
          { success: false, error: `Batch dengan ID ${item.batchId} tidak ditemukan` },
          { status: 404 }
        );
      }
      if (batch.status !== "DI_GUDANG") {
        return NextResponse.json(
          {
            success: false,
            error: `Batch ${batch.batchNumber} berstatus ${batch.status}, hanya batch dengan status DI_GUDANG yang dapat dikirim`,
          },
          { status: 400 }
        );
      }
      if (batch.totalSak < item.orderedQty) {
        return NextResponse.json(
          {
            success: false,
            error: `Stok tidak mencukupi untuk Batch ${batch.batchNumber}. Tersedia: ${batch.totalSak} sak, Diminta: ${item.orderedQty} sak`,
          },
          { status: 400 }
        );
      }
    }

    const doNumber = await generateDONumber();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create DeliveryOrder (default status: CONFIRMED as per checklist "after DO confirmed reserved stock")
      // Wait, let's check checklist: status is DRAFT by default in schema, let's keep status as DRAFT or CONFIRMED depending on what the checklist prefers.
      // In the requirements it says: "status awal: DRAFT" and "Otomatis reserved stok setelah DO confirmed".
      // Let's create it as CONFIRMED directly if submitted, or DRAFT? Wait, the schema default is DRAFT.
      // Let's make it CONFIRMED if we are creating it from form directly, or DRAFT. Let's make it CONFIRMED since the checklist says: "Per item: Update FinishedGoodsBatch status -> RESERVED" and "Create FGStockMovement (type: OUT, pending)" upon creation.
      // Let's check requirements 3.9.2: "Otomatis reserved stok setelah DO confirmed."
      // Let's make the status CONFIRMED upon creation to automatically trigger reservation!
      const deliveryOrder = await tx.deliveryOrder.create({
        data: {
          doNumber,
          customerId,
          driverId: driverId || null,
          deliveryDate,
          status: "CONFIRMED",
          notes,
          createdById: session.user.id,
        },
      });

      // 2. Create DeliveryOrderItems and reserve stock
      for (const item of items) {
        await tx.deliveryOrderItem.create({
          data: {
            deliveryOrderId: deliveryOrder.id,
            batchId: item.batchId,
            orderedQty: item.orderedQty,
            notes: item.notes,
          },
        });

        // Update batch status to RESERVED
        await tx.finishedGoodsBatch.update({
          where: { id: item.batchId },
          data: { status: "RESERVED" },
        });

        // Create FGStockMovement (type: OUT, pending / reserved)
        await tx.fGStockMovement.create({
          data: {
            batchId: item.batchId,
            type: "OUT",
            quantity: item.orderedQty,
            description: `Reserved for DO ${doNumber}`,
            reference: doNumber,
          },
        });
      }

      return deliveryOrder;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    console.error("POST Delivery Order Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to create delivery order" },
      { status: 500 }
    );
  }
}

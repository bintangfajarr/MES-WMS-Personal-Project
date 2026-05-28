import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { stockOpnameSchema } from "@/lib/validations/rice-stock";

// GET - List all stock opnames
export async function GET() {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS"]);
  if (error) return error;

  try {
    const data = await prisma.stockOpname.findMany({
      include: {
        conductor: { select: { name: true, email: true } },
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
      orderBy: { conductedAt: "desc" },
    });

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("GET Stock Opnames Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stock opnames" },
      { status: 500 }
    );
  }
}

// POST - Submit a new stock opname
export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS"]);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = stockOpnameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { items, notes } = parsed.data;

    // Validate all batch IDs exist
    const batchIds = items.map((item) => item.batchId);
    const batches = await prisma.finishedGoodsBatch.findMany({
      where: { id: { in: batchIds } },
    });

    if (batches.length !== batchIds.length) {
      return NextResponse.json(
        { success: false, error: "Satu atau lebih batch tidak ditemukan" },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const opname = await tx.stockOpname.create({
        data: {
          conductedBy: session.user.id,
          notes,
          items: {
            create: items.map((item) => {
              const batch = batches.find((b) => b.id === item.batchId)!;
              const systemQty = batch.totalSak;
              const variance = item.physicalQty - systemQty;
              return {
                batchId: item.batchId,
                systemQty,
                physicalQty: item.physicalQty,
                variance,
                notes: item.notes,
              };
            }),
          },
        },
        include: {
          conductor: { select: { name: true } },
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
      });

      return opname;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    console.error("POST Stock Opname Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to submit stock opname" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { inboundSchema } from "@/lib/validations/rice-stock";
import { runAlertChecks } from "@/lib/utils/alert-checker";

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS"]);
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = inboundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { batchId, locationId, confirmedQty, condition, notes } = parsed.data;

    // Validate batch exists and has correct status
    const batch = await prisma.finishedGoodsBatch.findUnique({
      where: { id: batchId },
      include: { product: true },
    });

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch tidak ditemukan" },
        { status: 404 }
      );
    }

    if (batch.status !== "PRODUKSI") {
      return NextResponse.json(
        {
          success: false,
          error: `Batch sudah berstatus ${batch.status}, hanya batch dengan status PRODUKSI yang bisa diterima`,
        },
        { status: 400 }
      );
    }

    // Validate location exists and is empty
    const location = await prisma.warehouseLocation.findUnique({
      where: { id: locationId },
    });

    if (!location) {
      return NextResponse.json(
        { success: false, error: "Lokasi gudang tidak ditemukan" },
        { status: 404 }
      );
    }

    if (location.status !== "KOSONG") {
      return NextResponse.json(
        {
          success: false,
          error: `Lokasi ${location.code} berstatus ${location.status}, hanya lokasi KOSONG yang bisa digunakan`,
        },
        { status: 400 }
      );
    }

    if (location.type !== "FINISHED_GOODS") {
      return NextResponse.json(
        {
          success: false,
          error: `Lokasi ${location.code} bukan tipe FINISHED_GOODS`,
        },
        { status: 400 }
      );
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update FinishedGoodsBatch
      const updatedBatch = await tx.finishedGoodsBatch.update({
        where: { id: batchId },
        data: {
          status: "DI_GUDANG",
          locationId,
          receivedToWarehouseAt: now,
          totalSak: confirmedQty,
          totalWeightKg: confirmedQty * Number(batch.packagingSize),
          notes: notes
            ? `${batch.notes ? batch.notes + " | " : ""}Kondisi: ${condition}. ${notes}`
            : batch.notes
            ? `${batch.notes} | Kondisi: ${condition}`
            : `Kondisi: ${condition}`,
        },
        include: {
          product: { select: { sku: true, name: true } },
          location: { select: { code: true, name: true } },
        },
      });

      // 2. Update WarehouseLocation status
      await tx.warehouseLocation.update({
        where: { id: locationId },
        data: { status: "TERISI" },
      });

      // 3. Create FGStockMovement (type: IN)
      await tx.fGStockMovement.create({
        data: {
          batchId,
          type: "IN",
          quantity: confirmedQty,
          description: `Penerimaan dari produksi ke lokasi ${location.code}. Kondisi: ${condition}`,
          reference: updatedBatch.batchNumber,
        },
      });

      return updatedBatch;
    });

    // Run alert checks in the background (non-blocking)
    runAlertChecks().catch((err) => console.error("Error running alert checks:", err));

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (e) {
    console.error("POST Inbound Rice Stock Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to process inbound rice stock" },
      { status: 500 }
    );
  }
}

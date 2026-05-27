import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { incomingQCSchema } from "@/lib/validations/paddy-lot";
import { calculateNetWeight } from "@/lib/utils/net-weight";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS"]);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = incomingQCSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const lot = await prisma.paddyLot.findUnique({
      where: { id },
    });

    if (!lot) {
      return NextResponse.json(
        { success: false, error: "Paddy lot not found" },
        { status: 404 }
      );
    }

    if (lot.status !== "MENUNGGU_QC") {
      return NextResponse.json(
        { success: false, error: "Paddy lot is not waiting for QC" },
        { status: 400 }
      );
    }

    const { moistureContent, dirtPercentage, colorAroma, result, rejectionReason, notes } = parsed.data;

    const updatedLot = await prisma.$transaction(async (tx) => {
      // 1. Create Incoming QC record
      const qc = await tx.incomingQC.create({
        data: {
          paddyLotId: id,
          moistureContent,
          dirtPercentage,
          colorAroma,
          result,
          rejectionReason: result === "GAGAL" ? rejectionReason : null,
          notes,
        },
      });

      const newStatus = result === "LULUS" ? "ANTRIAN_GILING" : "DITOLAK";

      // Re-calculate netWeight with QC values if they changed
      const newNetWeight = calculateNetWeight(
        Number(lot.grossWeight),
        Number(lot.sackWeight),
        dirtPercentage
      );

      // 2. Update Paddy Lot
      const lotUpdated = await tx.paddyLot.update({
        where: { id },
        data: {
          status: newStatus,
          moistureContent,
          dirtPercentage,
          netWeight: newNetWeight,
        },
      });

      // 3. Update RM Stock Movement
      if (result === "GAGAL") {
        // Create an OUT movement to deduct this lot's weight since it's rejected and returned
        await tx.rMStockMovement.create({
          data: {
            paddyLotId: id,
            type: "OUT",
            weightKg: lot.netWeight, // deduct the original registered weight
            description: `QC Gagal: ${rejectionReason || "Kualitas tidak memenuhi standar"}`,
            reference: lot.lotNumber,
          },
        });
      } else {
        // Adjust the weight in RMStockMovement if net weight changed due to dirt percentage updates in QC
        const weightDiff = newNetWeight - Number(lot.netWeight);
        if (weightDiff !== 0) {
          await tx.rMStockMovement.create({
            data: {
              paddyLotId: id,
              type: weightDiff > 0 ? "IN" : "OUT",
              weightKg: Math.abs(weightDiff),
              description: "Penyesuaian berat bersih setelah hasil QC",
              reference: lot.lotNumber,
            },
          });
        }
      }

      return lotUpdated;
    });

    return NextResponse.json({ success: true, data: updatedLot });
  } catch (e) {
    console.error("POST Paddy Lot QC Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to submit paddy lot QC" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS"]);
  if (error) return error;

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const deliveryOrder = await prisma.deliveryOrder.findUnique({
      where: { id },
    });

    if (!deliveryOrder) {
      return NextResponse.json(
        { success: false, error: "Delivery Order tidak ditemukan" },
        { status: 404 }
      );
    }

    if (deliveryOrder.status !== "CONFIRMED") {
      return NextResponse.json(
        {
          success: false,
          error: `Status Delivery Order adalah ${deliveryOrder.status}. Konfirmasi picking hanya bisa dilakukan jika status CONFIRMED`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.deliveryOrder.update({
      where: { id },
      data: { status: "PICKING" },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("PATCH Delivery Order Confirm Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to confirm delivery order" },
      { status: 500 }
    );
  }
}

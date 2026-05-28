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

    if (deliveryOrder.status !== "READY_TO_SHIP") {
      return NextResponse.json(
        {
          success: false,
          error: `Status Delivery Order adalah ${deliveryOrder.status}. Pengiriman hanya bisa dilakukan jika status READY_TO_SHIP`,
        },
        { status: 400 }
      );
    }

    const updated = await prisma.deliveryOrder.update({
      where: { id },
      data: {
        status: "SHIPPED",
        shippedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("PATCH Delivery Order Ship Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to mark delivery order as shipped" },
      { status: 500 }
    );
  }
}

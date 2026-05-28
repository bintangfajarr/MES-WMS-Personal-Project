import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "DRIVER"]);
  if (error) return error;

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const deliveryOrder = await prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        driver: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
        items: {
          include: {
            batch: {
              include: {
                product: { select: { sku: true, name: true } },
                location: { select: { code: true, name: true } },
              },
            },
          },
        },
        returns: true,
      },
    });

    if (!deliveryOrder) {
      return NextResponse.json(
        { success: false, error: "Delivery Order tidak ditemukan" },
        { status: 404 }
      );
    }

    // Drivers should only see their own assigned delivery orders
    if (session.user.role === "DRIVER" && deliveryOrder.driverId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Anda tidak ditugaskan untuk pengiriman ini" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: deliveryOrder });
  } catch (e) {
    console.error("GET Delivery Order Detail Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch delivery order details" },
      { status: 500 }
    );
  }
}

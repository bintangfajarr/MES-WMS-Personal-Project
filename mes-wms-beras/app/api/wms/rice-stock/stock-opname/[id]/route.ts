import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

// GET - Detail of a specific stock opname
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS"]);
  if (error) return error;

  try {
    const { id } = await params;

    const data = await prisma.stockOpname.findUnique({
      where: { id },
      include: {
        conductor: { select: { name: true, email: true, role: true } },
        items: {
          include: {
            batch: {
              include: {
                product: { select: { sku: true, name: true, type: true } },
                location: { select: { code: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Stock opname tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("GET Stock Opname Detail Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stock opname detail" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "OPR_PROD"]);
  if (error) return error;

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Check if alert exists
    const alert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!alert) {
      return NextResponse.json(
        { success: false, error: "Alert tidak ditemukan" },
        { status: 404 }
      );
    }

    // Dismiss alert within a Prisma transaction
    await prisma.$transaction(async (tx) => {
      // 1. Set alert as inactive
      await tx.alert.update({
        where: { id },
        data: { isActive: false },
      });

      // 2. Create AlertDismissal record
      await tx.alertDismissal.create({
        data: {
          alertId: id,
          dismissedBy: session.user.id,
        },
      });
    });

    return NextResponse.json({ success: true, message: "Alert berhasil di-dismiss" });
  } catch (e) {
    console.error("POST Dismiss Alert Error:", e);
    return NextResponse.json(
      { success: false, error: "Gagal me-dismiss alert" },
      { status: 500 }
    );
  }
}

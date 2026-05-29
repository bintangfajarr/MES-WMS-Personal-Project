import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

async function dismissAlert(id: string, userId: string) {
  // Check if alert exists
  const alert = await prisma.alert.findUnique({
    where: { id },
  });

  if (!alert) {
    return { success: false, error: "Alert tidak ditemukan", status: 404 };
  }

  if (!alert.isActive) {
    return { success: true, message: "Alert sudah diselesaikan sebelumnya" };
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
        dismissedBy: userId,
      },
    });
  });

  return { success: true, message: "Alert berhasil di-dismiss" };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "OPR_PROD"]);
  if (error) return error;

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const result = await dismissAlert(id, session.user.id);
    if (!result.success && result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (e) {
    console.error("PATCH Dismiss Alert Error:", e);
    return NextResponse.json(
      { success: false, error: "Gagal me-dismiss alert" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "OPR_PROD"]);
  if (error) return error;

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const result = await dismissAlert(id, session.user.id);
    if (!result.success && result.error) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (e) {
    console.error("POST Dismiss Alert Error:", e);
    return NextResponse.json(
      { success: false, error: "Gagal me-dismiss alert" },
      { status: 500 }
    );
  }
}

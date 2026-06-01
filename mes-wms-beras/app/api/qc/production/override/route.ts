import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const { sortingLogId, premium, medium, patah, notes } = await request.json();

    if (!sortingLogId) {
      return NextResponse.json(
        { success: false, error: "sortingLogId is required" },
        { status: 400 }
      );
    }

    const sortingLog = await prisma.sortingLog.findUnique({
      where: { id: sortingLogId },
      include: { productionLog: true },
    });

    if (!sortingLog) {
      return NextResponse.json(
        { success: false, error: "Sorting log tidak ditemukan" },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update the grading decision in sorting log
      const updatedLog = await tx.sortingLog.update({
        where: { id: sortingLogId },
        data: {
          gradingDecision: {
            PREMIUM: Number(premium || 0),
            MEDIUM: Number(medium || 0),
            PATAH: Number(patah || 0),
          },
        },
      });

      // 2. Document the override in the production log notes
      const timeStr = new Date().toLocaleString("id-ID");
      await tx.productionLog.update({
        where: { id: sortingLog.productionLogId },
        data: {
          notes: `${sortingLog.productionLog.notes || ""}\n[OVERRIDE QC - ${timeStr} - ${session.user.name}]: Alokasi baru -> Premium: ${premium} kg, Medium: ${medium} kg, Patah: ${patah} kg. Alasan: ${notes || "Tidak ada"}`.trim(),
        },
      });

      return updatedLog;
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    console.error("POST Grading Override Error:", e);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan override grading" },
      { status: 500 }
    );
  }
}

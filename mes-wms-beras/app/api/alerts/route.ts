import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { AlertType } from "@prisma/client";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "OPR_PROD", "DRIVER"]);
  if (error) return error;

  try {
    const role = session.user.role;

    // Define allowed alert types per role based on DOC-02 Section 3.11
    let allowedTypes: AlertType[] = [];

    if (role === "ADMIN") {
      // ADMIN sees all alerts
      allowedTypes = [
        "STOK_PADI_RENDAH",
        "STOK_BERAS_RENDAH",
        "KADALUARSA_DEKAT",
        "YIELD_RENDAH",
        "HUSKING_YIELD_RENDAH",
        "MESIN_MAINTENANCE",
        "PADI_TERLAMA",
        "DO_BELUM_KONFIRMASI"
      ];
    } else if (role === "OPR_WHS") {
      allowedTypes = ["KADALUARSA_DEKAT", "DO_BELUM_KONFIRMASI"];
    } else if (role === "OPR_PROD") {
      allowedTypes = ["HUSKING_YIELD_RENDAH"];
    } else {
      // DRIVER has no alerts targeted
      allowedTypes = [];
    }

    if (allowedTypes.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const alerts = await prisma.alert.findMany({
      where: {
        type: { in: allowedTypes },
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: alerts,
    });
  } catch (e) {
    console.error("GET Alerts Error:", e);
    return NextResponse.json(
      { success: false, error: "Gagal memuat daftar alert" },
      { status: 500 }
    );
  }
}

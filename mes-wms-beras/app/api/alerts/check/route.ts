import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/auth-guard";
import { runAlertChecks } from "@/lib/utils/alert-checker";

export async function POST() {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS", "OPR_PROD"]);
  if (error) return error;

  try {
    await runAlertChecks();
    return NextResponse.json({
      success: true,
      message: "Pengecekan alert berhasil dijalankan",
    });
  } catch (e) {
    console.error("POST Run Alert Checks Error:", e);
    return NextResponse.json(
      { success: false, error: "Gagal menjalankan pengecekan alert" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/utils/auth-guard";
import { getSuggestedBatchesFIFO } from "@/lib/utils/fifo";

export async function GET(request: Request) {
  const { session, error } = await requireAuth(["ADMIN", "OPR_WHS"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const packagingSizeStr = searchParams.get("packagingSize");
    const requiredSakStr = searchParams.get("requiredSak");

    if (!productId || !packagingSizeStr || !requiredSakStr) {
      return NextResponse.json(
        { success: false, error: "Missing required query parameters: productId, packagingSize, requiredSak" },
        { status: 400 }
      );
    }

    const packagingSize = parseFloat(packagingSizeStr);
    const requiredSak = parseInt(requiredSakStr, 10);

    if (isNaN(packagingSize) || packagingSize <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid packagingSize. Must be a positive number." },
        { status: 400 }
      );
    }

    if (isNaN(requiredSak) || requiredSak <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid requiredSak. Must be a positive integer." },
        { status: 400 }
      );
    }

    const suggestions = await getSuggestedBatchesFIFO(productId, packagingSize, requiredSak);

    return NextResponse.json({ success: true, data: suggestions });
  } catch (e) {
    console.error("GET FIFO Suggestions Error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to get FIFO suggestions" },
      { status: 500 }
    );
  }
}

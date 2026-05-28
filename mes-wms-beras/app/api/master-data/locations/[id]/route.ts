import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { editLocationSchema } from "@/lib/validations/location";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const { id } = await params;
    const location = await prisma.warehouseLocation.findUnique({ where: { id } });
    if (!location) return NextResponse.json({ success: false, error: "Location not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: location });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch location" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = editLocationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    const location = await prisma.warehouseLocation.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, data: location });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to update location" }, { status: 500 });
  }
}

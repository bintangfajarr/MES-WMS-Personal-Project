import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { editPackagingMaterialSchema } from "@/lib/validations/packaging-material";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const { id } = await params;
    const material = await prisma.packagingMaterial.findUnique({ where: { id } });
    if (!material) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: material });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = editPackagingMaterialSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    const material = await prisma.packagingMaterial.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, data: material });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to update" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { createPackagingMaterialSchema } from "@/lib/validations/packaging-material";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const data = await prisma.packagingMaterial.findMany({ orderBy: { code: "asc" } });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch packaging materials" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const body = await request.json();
    const parsed = createPackagingMaterialSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    const existing = await prisma.packagingMaterial.findUnique({ where: { code: parsed.data.code } });
    if (existing) return NextResponse.json({ success: false, error: "Code already in use" }, { status: 409 });
    const material = await prisma.packagingMaterial.create({ data: parsed.data });
    return NextResponse.json({ success: true, data: material }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to create packaging material" }, { status: 500 });
  }
}

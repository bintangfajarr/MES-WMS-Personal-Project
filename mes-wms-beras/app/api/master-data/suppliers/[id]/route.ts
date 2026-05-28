import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { editSupplierSchema } from "@/lib/validations/supplier";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const { id } = await params;
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: supplier });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch supplier" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = editSupplierSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    const supplier = await prisma.supplier.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, data: supplier });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to update supplier" }, { status: 500 });
  }
}

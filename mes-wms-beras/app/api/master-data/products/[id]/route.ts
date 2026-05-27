import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { editProductSchema } from "@/lib/validations/product";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: product });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = editProductSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    const product = await prisma.product.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, data: product });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}

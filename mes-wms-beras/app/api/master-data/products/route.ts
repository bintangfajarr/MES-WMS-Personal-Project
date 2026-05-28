import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { createProductSchema } from "@/lib/validations/product";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const data = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    const existing = await prisma.product.findUnique({ where: { sku: parsed.data.sku } });
    if (existing) return NextResponse.json({ success: false, error: "SKU already in use" }, { status: 409 });
    const product = await prisma.product.create({ data: parsed.data });
    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to create product" }, { status: 500 });
  }
}

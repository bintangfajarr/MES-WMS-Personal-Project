import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { createSupplierSchema } from "@/lib/validations/supplier";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const data = await prisma.supplier.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch suppliers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const body = await request.json();
    const parsed = createSupplierSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });

    const existing = await prisma.supplier.findUnique({ where: { code: parsed.data.code } });
    if (existing) return NextResponse.json({ success: false, error: "Code already in use" }, { status: 409 });

    const supplier = await prisma.supplier.create({ data: parsed.data });
    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to create supplier" }, { status: 500 });
  }
}

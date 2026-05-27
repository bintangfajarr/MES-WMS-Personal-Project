import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { createCustomerSchema } from "@/lib/validations/customer";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const data = await prisma.customer.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const body = await request.json();
    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    const existing = await prisma.customer.findUnique({ where: { code: parsed.data.code } });
    if (existing) return NextResponse.json({ success: false, error: "Code already in use" }, { status: 409 });
    const customer = await prisma.customer.create({ data: parsed.data });
    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to create customer" }, { status: 500 });
  }
}

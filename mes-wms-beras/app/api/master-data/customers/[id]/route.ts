import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { editCustomerSchema } from "@/lib/validations/customer";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: customer });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = editCustomerSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    const customer = await prisma.customer.update({ where: { id }, data: parsed.data });
    return NextResponse.json({ success: true, data: customer });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to update customer" }, { status: 500 });
  }
}

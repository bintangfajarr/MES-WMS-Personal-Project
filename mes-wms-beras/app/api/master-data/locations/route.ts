import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { createLocationSchema } from "@/lib/validations/location";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const data = await prisma.warehouseLocation.findMany({ orderBy: { code: "asc" } });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const body = await request.json();
    const parsed = createLocationSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    const existing = await prisma.warehouseLocation.findUnique({ where: { code: parsed.data.code } });
    if (existing) return NextResponse.json({ success: false, error: "Code already in use" }, { status: 409 });
    const location = await prisma.warehouseLocation.create({ data: parsed.data });
    return NextResponse.json({ success: true, data: location }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to create location" }, { status: 500 });
  }
}

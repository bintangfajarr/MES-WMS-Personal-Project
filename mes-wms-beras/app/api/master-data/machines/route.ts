import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { createMachineSchema } from "@/lib/validations/machine";

export async function GET() {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const data = await prisma.machine.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch machines" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const body = await request.json();
    const parsed = createMachineSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    const existing = await prisma.machine.findUnique({ where: { code: parsed.data.code } });
    if (existing) return NextResponse.json({ success: false, error: "Code already in use" }, { status: 409 });
    const { purchaseDate, lastMaintenanceDate, nextMaintenanceDate, ...rest } = parsed.data;
    const machine = await prisma.machine.create({
      data: {
        ...rest,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : null,
        nextMaintenanceDate: nextMaintenanceDate ? new Date(nextMaintenanceDate) : null,
      },
    });
    return NextResponse.json({ success: true, data: machine }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to create machine" }, { status: 500 });
  }
}

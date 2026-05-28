import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { editMachineSchema } from "@/lib/validations/machine";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const { id } = await params;
    const machine = await prisma.machine.findUnique({ where: { id } });
    if (!machine) return NextResponse.json({ success: false, error: "Machine not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: machine });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch machine" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = editMachineSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    const { purchaseDate, lastMaintenanceDate, nextMaintenanceDate, ...rest } = parsed.data;
    const updateData: any = { ...rest };
    if (purchaseDate !== undefined) updateData.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    if (lastMaintenanceDate !== undefined) updateData.lastMaintenanceDate = lastMaintenanceDate ? new Date(lastMaintenanceDate) : null;
    if (nextMaintenanceDate !== undefined) updateData.nextMaintenanceDate = nextMaintenanceDate ? new Date(nextMaintenanceDate) : null;
    const machine = await prisma.machine.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, data: machine });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to update machine" }, { status: 500 });
  }
}

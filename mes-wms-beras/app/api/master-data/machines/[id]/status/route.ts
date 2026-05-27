import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { updateMachineStatusSchema } from "@/lib/validations/machine";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateMachineStatusSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    const machine = await prisma.machine.update({ where: { id }, data: { status: parsed.data.status } });
    return NextResponse.json({ success: true, data: machine });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to update machine status" }, { status: 500 });
  }
}

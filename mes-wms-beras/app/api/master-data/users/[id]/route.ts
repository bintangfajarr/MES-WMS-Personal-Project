import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { editUserSchema } from "@/lib/validations/user";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, name: true, email: true, role: true,
        status: true, createdAt: true, updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = editUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: parsed.data,
      select: {
        id: true, name: true, email: true, role: true,
        status: true, createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

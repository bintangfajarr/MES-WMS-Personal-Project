import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/utils/auth-guard";
import { resetPasswordSchema } from "@/lib/validations/user";
import { hash } from "bcryptjs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(parsed.data.newPassword, 12);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: "Failed to reset password" },
      { status: 500 }
    );
  }
}

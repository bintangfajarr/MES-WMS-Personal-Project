import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

/**
 * Server-side auth guard for API routes.
 * Checks for a valid session and optionally validates user role.
 *
 * @param allowedRoles - Optional array of roles that are allowed to access the resource
 * @returns Object with session (if authenticated) or error response
 *
 * @example
 * ```ts
 * const { session, error } = await requireAuth(["ADMIN", "OPR_WHS"]);
 * if (error) return error;
 * // session is guaranteed to be non-null here
 * ```
 */
export async function requireAuth(allowedRoles?: Role[]) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return {
      session: null,
      error: NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}

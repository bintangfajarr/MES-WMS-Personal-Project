import { format } from "date-fns";
import prisma from "@/lib/prisma";

/**
 * Generate a unique Work Order Number with format WO-YYYYMMDD-XXX
 */
export async function generateWONumber(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `WO-${today}-`;

  const lastWO = await prisma.workOrder.findFirst({
    where: { woNumber: { startsWith: prefix } },
    orderBy: { woNumber: "desc" },
  });

  const nextSeq = lastWO
    ? parseInt(lastWO.woNumber.split("-")[2]) + 1
    : 1;

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}

import { format } from "date-fns";
import prisma from "@/lib/prisma";

/**
 * Generate a unique Delivery Order Number with format DO-YYYYMMDD-XXX
 */
export async function generateDONumber(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `DO-${today}-`;

  const lastDO = await prisma.deliveryOrder.findFirst({
    where: { doNumber: { startsWith: prefix } },
    orderBy: { doNumber: "desc" },
  });

  const nextSeq = lastDO
    ? parseInt(lastDO.doNumber.split("-")[2]) + 1
    : 1;

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}

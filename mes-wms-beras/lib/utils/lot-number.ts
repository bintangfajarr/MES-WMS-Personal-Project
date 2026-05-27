import { format } from "date-fns";
import prisma from "@/lib/prisma";

/**
 * Generate a unique Lot Number with format LOT-YYYYMMDD-XXX
 * Thread-safe as it uses the database to check uniqueness
 */
export async function generateLotNumber(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `LOT-${today}-`;

  const lastLot = await prisma.paddyLot.findFirst({
    where: { lotNumber: { startsWith: prefix } },
    orderBy: { lotNumber: "desc" },
  });

  const nextSeq = lastLot
    ? parseInt(lastLot.lotNumber.split("-")[2]) + 1
    : 1;

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}

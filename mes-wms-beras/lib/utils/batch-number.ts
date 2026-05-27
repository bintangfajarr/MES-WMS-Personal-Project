import { format } from "date-fns";
import prisma from "@/lib/prisma";

/**
 * Generate a unique Batch Number with format BATCH-YYYYMMDD-XXX
 */
export async function generateBatchNumber(): Promise<string> {
  const today = format(new Date(), "yyyyMMdd");
  const prefix = `BATCH-${today}-`;

  const lastBatch = await prisma.finishedGoodsBatch.findFirst({
    where: { batchNumber: { startsWith: prefix } },
    orderBy: { batchNumber: "desc" },
  });

  const nextSeq = lastBatch
    ? parseInt(lastBatch.batchNumber.split("-")[2]) + 1
    : 1;

  return `${prefix}${String(nextSeq).padStart(3, "0")}`;
}

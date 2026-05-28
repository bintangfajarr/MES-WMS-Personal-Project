import { prisma } from "@/lib/prisma";

/**
 * Suggests batches for a Delivery Order based on FIFO (earliest expiry date first).
 */
export async function getSuggestedBatchesFIFO(
  productId: string,
  packagingSize: number,
  requiredSak: number
) {
  const batches = await prisma.finishedGoodsBatch.findMany({
    where: {
      productId,
      packagingSize: parseFloat(packagingSize.toString()),
      status: "DI_GUDANG",
      totalSak: { gt: 0 },
    },
    include: {
      location: {
        select: {
          code: true,
        },
      },
    },
    orderBy: {
      expiryDate: "asc",
    },
  });

  const suggestions = [];
  let remaining = requiredSak;

  for (const batch of batches) {
    if (remaining <= 0) break;
    const taken = Math.min(batch.totalSak, remaining);
    suggestions.push({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      availableSak: batch.totalSak,
      suggestedSak: taken,
      expiryDate: batch.expiryDate,
      locationCode: batch.location?.code || "N/A",
    });
    remaining -= taken;
  }

  return suggestions;
}
